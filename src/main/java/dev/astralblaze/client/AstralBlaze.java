package dev.astralblaze.client;

import dev.astralblaze.client.config.ConfigManager;
import dev.astralblaze.client.config.ProfileManager;
import dev.astralblaze.client.core.ModuleManager;
import dev.astralblaze.client.hud.HudManager;
import dev.astralblaze.client.input.Keybinds;
import dev.astralblaze.client.perf.ClientStats;
import dev.astralblaze.client.theme.ThemeManager;
import dev.astralblaze.client.ui.toast.ToastManager;
import net.minecraft.resources.Identifier;

public final class AstralBlaze {
	public static final String MOD_ID = "astralblaze";
	public static final String NAME = "Astral Blaze";
	public static final String FULL_NAME = "Astral Blaze Client";
	public static final String VERSION = "1.0.0";
	public static final String MC_VERSION = "1.21.11";

	private static ModuleManager modules;
	private static HudManager hud;
	private static ThemeManager themes;
	private static ConfigManager config;
	private static ProfileManager profiles;
	private static ToastManager toasts;
	private static Keybinds keys;

	private AstralBlaze() {
	}

	public static Identifier id(String path) {
		return Identifier.fromNamespaceAndPath(MOD_ID, path);
	}

	static void bootstrap() {
		themes = new ThemeManager();
		modules = new ModuleManager();
		hud = new HudManager();
		profiles = new ProfileManager();
		config = new ConfigManager();
		toasts = new ToastManager();
		keys = new Keybinds();
		modules.registerDefaults();
		hud.registerDefaults();
		themes.registerDefaults();
		profiles.registerDefaults();
		config.load();
		keys.register();
		ClientStats.startSession();
	}

	public static ModuleManager modules() {
		return modules;
	}

	public static HudManager hud() {
		return hud;
	}

	public static ThemeManager themes() {
		return themes;
	}

	public static ConfigManager config() {
		return config;
	}

	public static ProfileManager profiles() {
		return profiles;
	}

	public static ToastManager toasts() {
		return toasts;
	}

	public static Keybinds keys() {
		return keys;
	}
}
