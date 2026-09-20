package dev.astralblaze.client.input;

import com.mojang.blaze3d.platform.InputConstants;
import dev.astralblaze.client.AstralBlaze;
import dev.astralblaze.client.ui.AstralScreen;
import dev.astralblaze.client.ui.HudEditorScreen;
import net.fabricmc.fabric.api.client.event.lifecycle.v1.ClientTickEvents;
import net.fabricmc.fabric.api.client.keybinding.v1.KeyBindingHelper;
import net.minecraft.client.KeyMapping;
import net.minecraft.client.Minecraft;
import net.minecraft.resources.Identifier;
import org.lwjgl.glfw.GLFW;

import java.util.ArrayList;
import java.util.List;

public final class Keybinds {
	public static final KeyMapping.Category CATEGORY = KeyMapping.Category.register(Identifier.fromNamespaceAndPath("astralblaze", "client"));
	public KeyMapping menu;
	public KeyMapping hudEditor;
	public KeyMapping zoom;

	public void register() {
		menu = KeyBindingHelper.registerKeyBinding(new KeyMapping("key.astralblaze.menu", InputConstants.Type.KEYSYM, GLFW.GLFW_KEY_RIGHT_SHIFT, CATEGORY));
		hudEditor = KeyBindingHelper.registerKeyBinding(new KeyMapping("key.astralblaze.hud_editor", InputConstants.Type.KEYSYM, GLFW.GLFW_KEY_RIGHT_CONTROL, CATEGORY));
		zoom = KeyBindingHelper.registerKeyBinding(new KeyMapping("key.astralblaze.zoom", InputConstants.Type.KEYSYM, GLFW.GLFW_KEY_C, CATEGORY));

		ClientTickEvents.END_CLIENT_TICK.register(client -> {
			while (menu.consumeClick()) {
				toggleMenu(client);
			}
			while (hudEditor.consumeClick()) {
				if (client.screen instanceof HudEditorScreen) {
					client.setScreen(null);
				} else if (client.level != null) {
					client.setScreen(new HudEditorScreen(client.screen));
				}
			}
		});
	}

	public void toggleMenu(Minecraft client) {
		if (client.screen instanceof AstralScreen) {
			client.setScreen(null);
			return;
		}
		client.setScreen(new AstralScreen(client.screen));
	}

	public List<String> conflicts() {
		List<String> issues = new ArrayList<>();
		if (menu.same(hudEditor)) {
			issues.add("Menu and HUD Editor share the same key.");
		}
		if (menu.same(zoom)) {
			issues.add("Menu and Zoom share the same key.");
		}
		if (hudEditor.same(zoom)) {
			issues.add("HUD Editor and Zoom share the same key.");
		}
		return issues;
	}
}
