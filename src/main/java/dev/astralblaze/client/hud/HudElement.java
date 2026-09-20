package dev.astralblaze.client.hud;

import com.google.gson.JsonObject;
import dev.astralblaze.client.core.Module;
import dev.astralblaze.client.core.ModuleCategory;
import dev.astralblaze.client.core.setting.BooleanSetting;
import dev.astralblaze.client.core.setting.ColorSetting;
import dev.astralblaze.client.core.setting.EnumSetting;
import dev.astralblaze.client.core.setting.NumberSetting;
import dev.astralblaze.client.theme.Theme;
import dev.astralblaze.client.ui.render.ColorUtil;
import dev.astralblaze.client.ui.render.GlassRenderer;
import net.minecraft.client.Minecraft;
import net.minecraft.client.gui.Font;
import net.minecraft.client.gui.GuiGraphics;

public abstract class HudElement extends Module {
	public enum Style {
		GLASS_PANEL,
		ROUNDED_PANEL,
		TEXT_ONLY,
		COMPACT
	}

	protected final NumberSetting scale;
	protected final NumberSetting opacity;
	protected final ColorSetting color;
	protected final BooleanSetting background;
	protected final BooleanSetting border;
	protected final NumberSetting radius;
	protected final EnumSetting<Style> style;
	private float xRel;
	private float yRel;
	private final float defaultX;
	private final float defaultY;
	private int lastW = 40;
	private int lastH = 16;
	private int lastX;
	private int lastY;

	protected HudElement(String name, String description, ModuleCategory category, boolean defaultEnabled, float defaultX, float defaultY) {
		super(name, description, category, defaultEnabled);
		this.defaultX = defaultX;
		this.defaultY = defaultY;
		this.xRel = defaultX;
		this.yRel = defaultY;
		this.scale = add(new NumberSetting("Scale", "Element scale.", 1.0, 0.5, 2.5, 0.05));
		this.opacity = add(new NumberSetting("Opacity", "Panel and text opacity.", 1.0, 0.15, 1.0, 0.05));
		this.color = add(new ColorSetting("Color", "Primary text/accent color.", 0xFF2A3140));
		this.background = add(new BooleanSetting("Background", "Draw a glass background.", true));
		this.border = add(new BooleanSetting("Border", "Draw a subtle border.", true));
		this.radius = add(new NumberSetting("Corner radius", "Rounded corners.", 10, 2, 24, 1));
		this.style = add(new EnumSetting<>("Style", "Visual style of this HUD element.", Style.GLASS_PANEL));
	}

	public float xRel() { return xRel; }
	public float yRel() { return yRel; }
	public void setRel(float x, float y) {
		this.xRel = clamp(x);
		this.yRel = clamp(y);
	}

	public void resetPosition() {
		setRel(defaultX, defaultY);
	}

	public int screenX(int sw) {
		return Math.round(xRel * sw);
	}

	public int screenY(int sh) {
		return Math.round(yRel * sh);
	}

	public int lastW() { return lastW; }
	public int lastH() { return lastH; }
	public int lastX() { return lastX; }
	public int lastY() { return lastY; }

	public boolean contains(double mx, double my) {
		return mx >= lastX && my >= lastY && mx <= lastX + lastW && my <= lastY + lastH;
	}

	public void renderHud(GuiGraphics g, Minecraft mc, int sw, int sh, float tickDelta, boolean editor) {
		if (!enabled() && !editor) {
			return;
		}
		float s = scale.floatValue();
		g.pose().pushMatrix();
		int x = screenX(sw);
		int y = screenY(sh);
		g.pose().translate(x, y);
		g.pose().scale(s, s);
		int[] size = renderContent(g, mc, tickDelta, editor);
		lastW = Math.max(8, Math.round(size[0] * s));
		lastH = Math.max(8, Math.round(size[1] * s));
		lastX = x;
		lastY = y;
		g.pose().popMatrix();
	}

	protected abstract int[] renderContent(GuiGraphics g, Minecraft mc, float tickDelta, boolean editor);

	protected int[] drawTextPanel(GuiGraphics g, Minecraft mc, String text) {
		return drawTextPanel(g, mc, text, null);
	}

	protected int[] drawTextPanel(GuiGraphics g, Minecraft mc, String text, String extra) {
		Font font = mc.font;
		Theme theme = GlassRenderer.theme();
		Style st = style.get();
		int padX = st == Style.TEXT_ONLY ? 0 : (st == Style.COMPACT ? 6 : 8);
		int padY = st == Style.TEXT_ONLY ? 0 : (st == Style.COMPACT ? 4 : 6);
		int textW = font.width(text);
		if (extra != null) {
			textW = Math.max(textW, font.width(extra));
		}
		int textH = extra == null ? 9 : 20;
		int w = textW + padX * 2;
		int h = textH + padY * 2;
		float op = opacity.floatValue();
		if (background.get() && st != Style.TEXT_ONLY) {
			int fill = ColorUtil.scaleAlpha(st == Style.ROUNDED_PANEL ? theme.panelFill() : ColorUtil.scaleAlpha(theme.panelFill(), 0.92F), op);
			int bord = border.get() ? ColorUtil.scaleAlpha(theme.border(), op) : 0;
			int shadow = st == Style.GLASS_PANEL ? ColorUtil.scaleAlpha(theme.shadow(), op) : 0;
			GlassRenderer.panel(g, 0, 0, w, h, radius.intValue(), fill, bord, shadow);
		}
		int col = ColorUtil.scaleAlpha(color.get(), op);
		GlassRenderer.text(g, font, text, padX, padY, col);
		if (extra != null) {
			GlassRenderer.text(g, font, extra, padX, padY + 11, ColorUtil.scaleAlpha(theme.textMuted(), op));
		}
		return new int[]{w, h};
	}

	@Override
	public JsonObject toJson() {
		JsonObject json = super.toJson();
		json.addProperty("x", xRel);
		json.addProperty("y", yRel);
		return json;
	}

	@Override
	public void fromJson(JsonObject json) {
		super.fromJson(json);
		if (json.has("x")) xRel = json.get("x").getAsFloat();
		if (json.has("y")) yRel = json.get("y").getAsFloat();
	}

	private static float clamp(float v) {
		return v < 0 ? 0 : Math.min(0.98F, v);
	}
}
