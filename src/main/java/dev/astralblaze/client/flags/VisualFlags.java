package dev.astralblaze.client.flags;

/**
 * Cached visual flags read by mixins. Updated only when modules/settings change,
 * never allocated or recomputed per frame.
 */
public final class VisualFlags {
	public static boolean fullbright;
	public static boolean noHurtCam;
	public static boolean noViewBob;
	public static boolean noVignette;
	public static boolean noFireOverlay;
	public static boolean noPumpkinOverlay;
	public static boolean hideWeather;
	public static boolean customCrosshair;
	public static boolean reduceMotion;
	public static boolean reduceGuiMotion;
	public static float particleChance = 1.0F;
	public static float zoomFovMul = 1.0F;
	public static float zoomTarget = 1.0F;
	public static float zoomSpeed = 12.0F;

	private VisualFlags() {
	}

	public static void tickZoom(float frameSeconds) {
		if (zoomFovMul == zoomTarget) {
			return;
		}
		if (reduceMotion) {
			zoomFovMul = zoomTarget;
			return;
		}
		float t = Math.min(1.0F, frameSeconds * zoomSpeed);
		zoomFovMul += (zoomTarget - zoomFovMul) * t;
		if (Math.abs(zoomFovMul - zoomTarget) < 0.001F) {
			zoomFovMul = zoomTarget;
		}
	}
}
