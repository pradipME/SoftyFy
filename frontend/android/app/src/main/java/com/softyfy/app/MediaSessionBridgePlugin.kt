package com.softyfy.app

import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.content.Context
import android.content.Intent
import android.graphics.Bitmap
import android.graphics.BitmapFactory
import android.media.MediaMetadata
import android.media.session.MediaSession
import android.media.session.PlaybackState
import android.os.Build
import android.os.Handler
import android.os.Looper
import androidx.core.app.NotificationCompat
import androidx.media.app.NotificationCompat.MediaStyle
import com.getcapacitor.BridgeActivity
import android.support.v4.media.session.MediaSessionCompat
import com.getcapacitor.JSObject
import com.getcapacitor.Plugin
import com.getcapacitor.PluginCall
import com.getcapacitor.PluginMethod
import com.getcapacitor.annotation.CapacitorPlugin
import java.net.HttpURLConnection
import java.net.URL
import java.util.concurrent.Executors

/**
 * Exposes the system MediaSession (and its companion media notification) to the
 * web layer. Android media notifications / the quick-settings player / lock
 * screen controls are driven by a MediaSession owned by the host activity, not
 * by the WebView — this bridge creates it and lets the JS player control it.
 *
 * Transport events (play/pause/next/previous/seek) are delivered back as
 * `playbackAction` events so the web player stays the single source of truth.
 */
@CapacitorPlugin(name = "MediaSessionBridge")
class MediaSessionBridgePlugin : Plugin() {

  private val mainHandler = Handler(Looper.getMainLooper())
  private val artworkExecutor = Executors.newSingleThreadExecutor()
  private var session: MediaSession? = null
  private var lastTitle = ""
  private var lastArtist = ""
  private var lastAlbum = ""
  private var lastBitmap: Bitmap? = null

  companion object {
    private const val CHANNEL_ID = "softyfy_media"
    private const val NOTIFICATION_ID = 1002
  }

  override fun load() {
    super.load()
    ensureSession()
    ensureChannel()
  }

  override fun handleOnDestroy() {
    clearNotification()
    session?.release()
    session = null
    super.handleOnDestroy()
  }

  private fun ensureSession() {
    if (session != null) return
    val ctx = context ?: return
    val created = MediaSession(ctx, "SoftyFy")
    created.setFlags(MediaSession.FLAG_HANDLES_MEDIA_BUTTONS or MediaSession.FLAG_HANDLES_TRANSPORT_CONTROLS)
    created.setCallback(mediaSessionCallback)
    created.isActive = false
    session = created
  }

  private fun ensureChannel() {
    val ctx = context ?: return
    if (Build.VERSION.SDK_INT < Build.VERSION_CODES.O) return
    val nm = ctx.getSystemService(Context.NOTIFICATION_SERVICE) as? NotificationManager ?: return
    val channel = NotificationChannel(CHANNEL_ID, "Playback", NotificationManager.IMPORTANCE_LOW).apply {
      description = "Media playback controls"
      setShowBadge(false)
    }
    nm.createNotificationChannel(channel)
  }

  private val mediaSessionCallback = object : MediaSession.Callback() {
    override fun onPlay() = postAction("play")

    override fun onPause() = postAction("pause")

    override fun onStop() = postAction("pause")

    override fun onSkipToNext() = postAction("next")

    override fun onSkipToPrevious() = postAction("previous")

    override fun onSeekTo(pos: Long) {
      mainHandler.post {
        val data = JSObject().apply {
          put("action", "seekto")
          put("position", pos.toDouble())
        }
        notifyListeners("playbackAction", data, false)
      }
    }
  }

  private fun postAction(action: String) {
    mainHandler.post {
      notifyListeners("playbackAction", JSObject().apply { put("action", action) }, false)
    }
  }

  private fun openAppPendingIntent(): PendingIntent? {
    val ctx = context ?: return null
    val target = activity?.javaClass ?: BridgeActivity::class.java
    val intent = Intent(ctx, target).apply {
      flags = Intent.FLAG_ACTIVITY_CLEAR_TOP or Intent.FLAG_ACTIVITY_SINGLE_TOP
    }
    return PendingIntent.getActivity(
      ctx,
      0,
      intent,
      PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE,
    )
  }

  @PluginMethod
  fun updateNowPlaying(call: PluginCall) {
    ensureSession()
    ensureChannel()
    val s = session ?: run {
      call.reject("Media session unavailable")
      return
    }

    lastTitle = call.getString("title") ?: ""
    lastArtist = call.getString("artist") ?: ""
    lastAlbum = call.getString("album") ?: ""
    val artwork = call.getString("artwork")
    val duration = call.getDouble("duration") ?: 0.0
    val position = call.getDouble("position") ?: 0.0
    val playing = call.getBoolean("playing") ?: false

    val metadata = buildMetadata(lastBitmap)
    val actions = PlaybackState.ACTION_PLAY or PlaybackState.ACTION_PAUSE or
      PlaybackState.ACTION_PLAY_PAUSE or PlaybackState.ACTION_SKIP_TO_NEXT or
      PlaybackState.ACTION_SKIP_TO_PREVIOUS or PlaybackState.ACTION_SEEK_TO or
      PlaybackState.ACTION_STOP

    val playbackState = PlaybackState.Builder()
      .setActions(actions)
      .setState(if (playing) PlaybackState.STATE_PLAYING else PlaybackState.STATE_PAUSED, position.toLong(), 1f)
      .build()

    s.setMetadata(metadata)
    s.setPlaybackState(playbackState)
    s.isActive = true

    postNotification(playing)

    call.resolve()

    if (!artwork.isNullOrEmpty()) {
      loadArtwork(artwork) { bmp ->
        if (bmp == null) return@loadArtwork
        lastBitmap = bmp
        mainHandler.post {
          val current = session
          if (current === s) {
            s.setMetadata(buildMetadata(bmp))
          }
        }
      }
    }
  }

  @PluginMethod
  fun updatePosition(call: PluginCall) {
    val s = session ?: run {
      call.resolve()
      return
    }
    val position = call.getDouble("position") ?: 0.0
    val duration = call.getDouble("duration") ?: 0.0
    val playing = call.getBoolean("playing") ?: false
    val stateToUse = if (playing) PlaybackState.STATE_PLAYING else PlaybackState.STATE_PAUSED
    val builder = PlaybackState.Builder()
      .setActions(
        PlaybackState.ACTION_PLAY or PlaybackState.ACTION_PAUSE or
          PlaybackState.ACTION_PLAY_PAUSE or PlaybackState.ACTION_SKIP_TO_NEXT or
          PlaybackState.ACTION_SKIP_TO_PREVIOUS or PlaybackState.ACTION_SEEK_TO or
          PlaybackState.ACTION_STOP,
      )
      .setState(stateToUse, position.toLong(), 1f)
      .setBufferedPosition(duration.toLong())
    s.setPlaybackState(builder.build())
    call.resolve()
  }

  @PluginMethod
  fun setPlaybackState(call: PluginCall) {
    val s = session ?: run {
      call.resolve()
      return
    }
    val playing = call.getBoolean("playing") ?: false
    val position = s.controller.playbackState?.position ?: 0L
    val builder = PlaybackState.Builder()
      .setActions(
        PlaybackState.ACTION_PLAY or PlaybackState.ACTION_PAUSE or
          PlaybackState.ACTION_PLAY_PAUSE or PlaybackState.ACTION_SKIP_TO_NEXT or
          PlaybackState.ACTION_SKIP_TO_PREVIOUS or PlaybackState.ACTION_SEEK_TO or
          PlaybackState.ACTION_STOP,
      )
      .setState(if (playing) PlaybackState.STATE_PLAYING else PlaybackState.STATE_PAUSED, position, 1f)
    s.setPlaybackState(builder.build())
    postNotification(playing)
    call.resolve()
  }

  @PluginMethod
  fun clearNowPlaying(call: PluginCall) {
    session?.isActive = false
    clearNotification()
    call.resolve()
  }

  private fun buildMetadata(bitmap: Bitmap?): MediaMetadata {
    val builder = MediaMetadata.Builder()
      .putString(MediaMetadata.METADATA_KEY_TITLE, lastTitle)
      .putString(MediaMetadata.METADATA_KEY_ARTIST, lastArtist)
      .putString(MediaMetadata.METADATA_KEY_ALBUM, lastAlbum)
    if (bitmap != null) {
      builder.putBitmap(MediaMetadata.METADATA_KEY_ALBUM_ART, bitmap)
    }
    return builder.build()
  }

  private fun postNotification(playing: Boolean) {
    val ctx = context ?: return
    val s = session ?: return
    val nm = ctx.getSystemService(Context.NOTIFICATION_SERVICE) as? NotificationManager ?: return
    try {
      val notification = NotificationCompat.Builder(ctx, CHANNEL_ID)
        .setSmallIcon(R.drawable.ic_stat_media)
        .setContentTitle(lastTitle)
        .setContentText(lastArtist)
        .setContentIntent(openAppPendingIntent())
        .setVisibility(NotificationCompat.VISIBILITY_PUBLIC)
        .setOngoing(playing)
        .setShowWhen(false)
        .setOnlyAlertOnce(true)
        .setColor(0xFF121212.toInt())
        .setStyle(MediaStyle().setMediaSession(MediaSessionCompat.Token.fromToken(s.sessionToken)).setShowCancelButton(true))
        .build()
      nm.notify(NOTIFICATION_ID, notification)
    } catch (_: Exception) {
      // POST_NOTIFICATIONS denied on 13+ — the media session still runs.
    }
  }

  private fun clearNotification() {
    val ctx = context ?: return
    val nm = ctx.getSystemService(Context.NOTIFICATION_SERVICE) as? NotificationManager ?: return
    try {
      nm.cancel(NOTIFICATION_ID)
    } catch (_: Exception) {
      // Ignore.
    }
  }

  private fun loadArtwork(url: String, onResult: (Bitmap?) -> Unit) {
    artworkExecutor.execute {
      var bitmap: Bitmap? = null
      var conn: HttpURLConnection? = null
      try {
        conn = URL(url).openConnection() as HttpURLConnection
        conn.connectTimeout = 10_000
        conn.readTimeout = 10_000
        conn.instanceFollowRedirects = true
        conn.setRequestProperty("User-Agent", "unspecified")
        if (conn.responseCode in 200..299) {
          bitmap = BitmapFactory.decodeStream(conn.inputStream)
        }
      } catch (_: Exception) {
        // Artwork is decorative — playback state is unaffected.
      } finally {
        try {
          conn?.disconnect()
        } catch (_: Exception) {
          // Ignore.
        }
      }
      onResult(bitmap)
    }
  }
}