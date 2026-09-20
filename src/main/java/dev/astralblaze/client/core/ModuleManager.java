package dev.astralblaze.client.core;

import dev.astralblaze.client.AstralBlaze;
import dev.astralblaze.client.hud.HudElement;
import dev.astralblaze.client.module.misc.MenuBackgroundModule;
import dev.astralblaze.client.module.performance.PerformanceModule;
import dev.astralblaze.client.module.visual.FullbrightModule;
import dev.astralblaze.client.module.visual.OverlayModule;
import dev.astralblaze.client.module.visual.ZoomModule;
import net.minecraft.client.Minecraft;

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;

public final class ModuleManager {
	private final List<Module> modules = new ArrayList<>();
	private FullbrightModule fullbright;
	private ZoomModule zoom;
	private OverlayModule overlays;
	private PerformanceModule performance;
	private MenuBackgroundModule menuBackground;

	public void registerDefaults() {
		fullbright = add(new FullbrightModule());
		zoom = add(new ZoomModule());
		overlays = add(new OverlayModule());
		performance = add(new PerformanceModule());
		menuBackground = add(new MenuBackgroundModule());
	}

	public void attachHud(List<HudElement> hud) {
		for (HudElement el : hud) {
			if (!modules.contains(el)) {
				modules.add(el);
			}
		}
	}

	private <T extends Module> T add(T module) {
		modules.add(module);
		return module;
	}

	public List<Module> all() {
		if (AstralBlaze.hud() != null) {
			attachHud(AstralBlaze.hud().elements());
		}
		return Collections.unmodifiableList(modules);
	}

	public List<Module> of(ModuleCategory category) {
		List<Module> out = new ArrayList<>();
		for (Module m : all()) {
			if (m.category() == category) {
				out.add(m);
			}
		}
		return out;
	}

	public List<Module> search(String query) {
		List<Module> out = new ArrayList<>();
		for (Module m : all()) {
			if (m.matches(query)) {
				out.add(m);
			}
		}
		return out;
	}

	public void tick(Minecraft mc) {
		for (Module module : all()) {
			if (module.enabled()) {
				module.tick(mc);
			}
		}
		syncFlags();
	}

	public void syncFlags() {
		if (overlays != null) overlays.sync();
		if (performance != null) performance.sync();
		if (fullbright != null) {
			dev.astralblaze.client.flags.VisualFlags.fullbright = fullbright.enabled();
		}
		if (AstralBlaze.hud() != null && AstralBlaze.hud().crosshair() != null) {
			dev.astralblaze.client.flags.VisualFlags.customCrosshair = AstralBlaze.hud().crosshair().enabled();
		}
	}

	public ZoomModule zoom() {
		return zoom;
	}

	public OverlayModule overlays() {
		return overlays;
	}

	public PerformanceModule performance() {
		return performance;
	}

	public MenuBackgroundModule menuBackground() {
		return menuBackground;
	}

	public Module byName(String name) {
		for (Module m : all()) {
			if (m.name().equalsIgnoreCase(name)) {
				return m;
			}
		}
		return null;
	}
}
