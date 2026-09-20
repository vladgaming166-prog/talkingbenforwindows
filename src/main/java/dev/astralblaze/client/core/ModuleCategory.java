package dev.astralblaze.client.core;

public enum ModuleCategory {
	HOME("Home"),
	HUD("HUD"),
	VISUAL("Visual"),
	PERFORMANCE("Performance"),
	PVP("PvP"),
	WORLD("World"),
	MOVEMENT("Movement"),
	SOCIAL("Social"),
	MISC("Misc"),
	SETTINGS("Settings");

	private final String display;

	ModuleCategory(String display) {
		this.display = display;
	}

	public String display() {
		return display;
	}
}
