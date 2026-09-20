package dev.astralblaze.client.hud;

import com.google.gson.JsonObject;
import dev.astralblaze.client.core.Module;
import dev.astralblaze.client.hud.elements.ArmorHud;
import dev.astralblaze.client.hud.elements.BiomeHud;
import dev.astralblaze.client.hud.elements.ClockHud;
import dev.astralblaze.client.hud.elements.CoordinatesHud;
import dev.astralblaze.client.hud.elements.CpsHud;
import dev.astralblaze.client.hud.elements.CrosshairHud;
import dev.astralblaze.client.hud.elements.DirectionHud;
import dev.astralblaze.client.hud.elements.FpsHud;
import dev.astralblaze.client.hud.elements.KeystrokesHud;
import dev.astralblaze.client.hud.elements.MemoryHud;
import dev.astralblaze.client.hud.elements.PingHud;
import dev.astralblaze.client.hud.elements.PotionHud;
import dev.astralblaze.client.hud.elements.ServerHud;
import dev.astralblaze.client.hud.elements.SessionHud;
import dev.astralblaze.client.hud.elements.SpeedHud;
import dev.astralblaze.client.hud.elements.StatusHud;
import net.minecraft.client.Minecraft;
import net.minecraft.client.gui.GuiGraphics;

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;

public final class HudManager {
	private final List<HudElement> elements = new ArrayList<>();
	private CrosshairHud crosshair;

	public void registerDefaults() {
		elements.add(new FpsHud());
		elements.add(new PingHud());
		elements.add(new KeystrokesHud());
		elements.add(new CpsHud());
		elements.add(new ArmorHud());
		elements.add(new PotionHud());
		elements.add(new CoordinatesHud());
		elements.add(new DirectionHud());
		elements.add(new BiomeHud());
		elements.add(new ClockHud());
		elements.add(new SessionHud());
		elements.add(new ServerHud());
		elements.add(new MemoryHud());
		elements.add(new SpeedHud());
		crosshair = new CrosshairHud();
		elements.add(crosshair);
		elements.add(new StatusHud());
	}

	public List<HudElement> elements() {
		return Collections.unmodifiableList(elements);
	}

	public List<Module> asModules() {
		return Collections.unmodifiableList(elements);
	}

	public CrosshairHud crosshair() {
		return crosshair;
	}

	public void render(GuiGraphics g, Minecraft mc, boolean editor) {
		if (mc.options.hideGui && !editor) {
			return;
		}
		int sw = mc.getWindow().getGuiScaledWidth();
		int sh = mc.getWindow().getGuiScaledHeight();
		for (HudElement element : elements) {
			if (element instanceof CrosshairHud) {
				continue;
			}
			element.renderHud(g, mc, sw, sh, 1F, editor);
		}
		if (crosshair != null && (crosshair.enabled() || editor) && !editor) {
			crosshair.renderCentered(g, mc, sw, sh);
		} else if (editor && crosshair != null) {
			crosshair.renderHud(g, mc, sw, sh, 1F, true);
		}
	}

	public HudElement at(double mx, double my) {
		for (int i = elements.size() - 1; i >= 0; i--) {
			HudElement el = elements.get(i);
			if (el.contains(mx, my)) {
				return el;
			}
		}
		return null;
	}

	public JsonObject toJson() {
		JsonObject json = new JsonObject();
		for (HudElement el : elements) {
			json.add(el.name(), el.toJson());
		}
		return json;
	}

	public void fromJson(JsonObject json) {
		if (json == null) {
			return;
		}
		for (HudElement el : elements) {
			if (json.has(el.name()) && json.get(el.name()).isJsonObject()) {
				el.fromJson(json.getAsJsonObject(el.name()));
			}
		}
	}
}
