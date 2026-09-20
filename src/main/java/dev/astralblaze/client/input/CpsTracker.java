package dev.astralblaze.client.input;

import net.minecraft.client.Minecraft;
import org.lwjgl.glfw.GLFW;

/**
 * Lightweight click-per-second tracker. Observes input only; never injects clicks.
 */
public final class CpsTracker {
	private static final int WINDOW_MS = 1000;
	private static final int MAX = 64;
	private static final long[] left = new long[MAX];
	private static final long[] right = new long[MAX];
	private static int leftHead, leftCount, rightHead, rightCount;
	private static boolean leftWas, rightWas;
	private static int leftCps, rightCps;
	private static long lastPrune;

	private CpsTracker() {
	}

	public static void poll(Minecraft mc) {
		long handle = mc.getWindow().handle();
		boolean l = GLFW.glfwGetMouseButton(handle, GLFW.GLFW_MOUSE_BUTTON_LEFT) == GLFW.GLFW_PRESS;
		boolean r = GLFW.glfwGetMouseButton(handle, GLFW.GLFW_MOUSE_BUTTON_RIGHT) == GLFW.GLFW_PRESS;
		long now = System.currentTimeMillis();
		if (l && !leftWas) {
			push(true, now);
		}
		if (r && !rightWas) {
			push(false, now);
		}
		leftWas = l;
		rightWas = r;
		if (now - lastPrune >= 50) {
			lastPrune = now;
			leftCps = prune(left, leftHead, leftCount, now, true);
			rightCps = prune(right, rightHead, rightCount, now, false);
		}
	}

	private static void push(boolean isLeft, long now) {
		if (isLeft) {
			left[(leftHead + leftCount) % MAX] = now;
			if (leftCount < MAX) {
				leftCount++;
			} else {
				leftHead = (leftHead + 1) % MAX;
			}
		} else {
			right[(rightHead + rightCount) % MAX] = now;
			if (rightCount < MAX) {
				rightCount++;
			} else {
				rightHead = (rightHead + 1) % MAX;
			}
		}
	}

	private static int prune(long[] buf, int head, int count, long now, boolean isLeft) {
		int h = head;
		int c = count;
		while (c > 0 && now - buf[h] > WINDOW_MS) {
			h = (h + 1) % MAX;
			c--;
		}
		if (isLeft) {
			leftHead = h;
			leftCount = c;
		} else {
			rightHead = h;
			rightCount = c;
		}
		return c;
	}

	public static int left() {
		return leftCps;
	}

	public static int right() {
		return rightCps;
	}
}
