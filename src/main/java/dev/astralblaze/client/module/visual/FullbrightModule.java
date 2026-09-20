package dev.astralblaze.client.module.visual;

import dev.astralblaze.client.core.Module;
import dev.astralblaze.client.core.ModuleCategory;
import dev.astralblaze.client.flags.VisualFlags;

public final class FullbrightModule extends Module {
	public FullbrightModule() {
		super("Fullbright", "Client-side full brightness. Does not change world lighting on the server.", ModuleCategory.VISUAL, false);
	}

	@Override
	protected void onEnable() {
		VisualFlags.fullbright = true;
	}

	@Override
	protected void onDisable() {
		VisualFlags.fullbright = false;
	}
}
