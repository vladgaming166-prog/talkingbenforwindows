package dev.astralblaze.client.module.visual;

import dev.astralblaze.client.core.Module;
import dev.astralblaze.client.core.ModuleCategory;
import dev.astralblaze.client.core.setting.KeybindSetting;
import dev.astralblaze.client.core.setting.NumberSetting;
import dev.astralblaze.client.flags.VisualFlags;
import net.minecraft.client.Minecraft;
import org.lwjgl.glfw.GLFW;

public final class ZoomModule extends Module {
	private final NumberSetting fovMul = add(new NumberSetting("FOV multiplier", "How far the camera zooms in. Visual only.", 0.32, 0.12, 0.8, 0.02));
	private final NumberSetting speed = add(new NumberSetting("Smooth speed", "How quickly zoom eases in and out.", 12, 4, 24, 1));
	public final KeybindSetting key = add(new KeybindSetting("Key", "Hold to zoom. Default C.", GLFW.GLFW_KEY_C));

	public ZoomModule() {
		super("Zoom", "Hold a key to zoom the camera. Does not change movement.", ModuleCategory.VISUAL, true);
	}

	@Override
	protected void onDisable() {
		VisualFlags.zoomTarget = 1F;
		VisualFlags.zoomFovMul = 1F;
	}

	@Override
	public void tick(Minecraft mc) {
		VisualFlags.zoomSpeed = speed.floatValue();
		if (!enabled() || key.isUnbound() || mc.screen != null) {
			VisualFlags.zoomTarget = 1F;
			return;
		}
		long handle = mc.getWindow().handle();
		boolean down = GLFW.glfwGetKey(handle, key.get()) == GLFW.GLFW_PRESS;
		VisualFlags.zoomTarget = down ? fovMul.floatValue() : 1F;
	}
}
