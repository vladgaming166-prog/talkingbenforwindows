package dev.astralblaze.client.module.performance;

import dev.astralblaze.client.core.Module;
import dev.astralblaze.client.core.ModuleCategory;
import dev.astralblaze.client.core.setting.BooleanSetting;
import dev.astralblaze.client.core.setting.NumberSetting;
import dev.astralblaze.client.flags.VisualFlags;

public final class PerformanceModule extends Module {
	private final NumberSetting particles = add(new NumberSetting("Particle amount", "1 is vanilla, 0 hides extra particles.", 1.0, 0.0, 1.0, 0.05));
	private final BooleanSetting weather = add(new BooleanSetting("Hide weather", "Skip rain/snow rendering.", false));
	private final BooleanSetting reduceMotion = add(new BooleanSetting("Reduce motion", "Disable or shorten UI and zoom animations.", false));
	private final BooleanSetting reduceGui = add(new BooleanSetting("Reduce GUI motion", "Keep world zoom, skip menu animations.", false));

	public PerformanceModule() {
		super("Performance Tweaks", "Safe client-side rendering reductions. Individually toggleable.", ModuleCategory.PERFORMANCE, true);
	}

	@Override
	protected void onEnable() {
		sync();
	}

	@Override
	protected void onDisable() {
		VisualFlags.particleChance = 1F;
		VisualFlags.hideWeather = false;
		VisualFlags.reduceMotion = false;
		VisualFlags.reduceGuiMotion = false;
	}

	public void sync() {
		boolean on = enabled();
		VisualFlags.particleChance = on ? particles.floatValue() : 1F;
		VisualFlags.hideWeather = on && weather.get();
		VisualFlags.reduceMotion = on && reduceMotion.get();
		VisualFlags.reduceGuiMotion = on && reduceGui.get();
	}
}
