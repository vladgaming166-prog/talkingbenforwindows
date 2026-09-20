package dev.astralblaze.client.module.visual;

import dev.astralblaze.client.core.Module;
import dev.astralblaze.client.core.ModuleCategory;
import dev.astralblaze.client.core.setting.BooleanSetting;
import dev.astralblaze.client.flags.VisualFlags;

public final class OverlayModule extends Module {
	private final BooleanSetting hurt = add(new BooleanSetting("Disable hurt camera", "Removes the hurt tilt.", true));
	private final BooleanSetting bob = add(new BooleanSetting("Disable view bobbing", "Client camera bobbing only.", false));
	private final BooleanSetting vignette = add(new BooleanSetting("Disable vignette", "Hides the vignette overlay.", true));
	private final BooleanSetting fire = add(new BooleanSetting("Disable fire overlay", "Hides first-person fire texture.", false));
	private final BooleanSetting pumpkin = add(new BooleanSetting("Disable pumpkin overlay", "Hides the carved pumpkin blur.", true));

	public OverlayModule() {
		super("Visual Overlays", "Toggle vanilla first-person overlays. Client-side only.", ModuleCategory.VISUAL, true);
	}

	@Override
	protected void onEnable() {
		sync();
	}

	@Override
	protected void onDisable() {
		VisualFlags.noHurtCam = false;
		VisualFlags.noViewBob = false;
		VisualFlags.noVignette = false;
		VisualFlags.noFireOverlay = false;
		VisualFlags.noPumpkinOverlay = false;
	}

	public void sync() {
		boolean on = enabled();
		VisualFlags.noHurtCam = on && hurt.get();
		VisualFlags.noViewBob = on && bob.get();
		VisualFlags.noVignette = on && vignette.get();
		VisualFlags.noFireOverlay = on && fire.get();
		VisualFlags.noPumpkinOverlay = on && pumpkin.get();
	}
}
