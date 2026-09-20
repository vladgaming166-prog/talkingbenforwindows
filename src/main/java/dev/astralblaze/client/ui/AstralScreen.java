package dev.astralblaze.client.ui;

import dev.astralblaze.client.AstralBlaze;
import dev.astralblaze.client.core.Module;
import dev.astralblaze.client.core.ModuleCategory;
import dev.astralblaze.client.core.setting.BooleanSetting;
import dev.astralblaze.client.core.setting.ColorSetting;
import dev.astralblaze.client.core.setting.EnumSetting;
import dev.astralblaze.client.core.setting.KeybindSetting;
import dev.astralblaze.client.core.setting.NumberSetting;
import dev.astralblaze.client.core.setting.Setting;
import dev.astralblaze.client.flags.VisualFlags;
import dev.astralblaze.client.perf.ClientStats;
import dev.astralblaze.client.theme.Theme;
import dev.astralblaze.client.ui.render.ColorUtil;
import dev.astralblaze.client.ui.render.GlassRenderer;
import net.minecraft.client.gui.GuiGraphics;
import net.minecraft.client.gui.screens.Screen;
import net.minecraft.client.input.CharacterEvent;
import net.minecraft.client.input.KeyEvent;
import net.minecraft.client.input.MouseButtonEvent;
import net.minecraft.network.chat.Component;
import net.minecraft.util.Mth;
import org.lwjgl.glfw.GLFW;

import java.util.ArrayList;
import java.util.List;
import java.util.Locale;

public final class AstralScreen extends Screen {
	private static final ModuleCategory[] TABS = {
		ModuleCategory.HOME, ModuleCategory.HUD, ModuleCategory.VISUAL, ModuleCategory.PERFORMANCE,
		ModuleCategory.PVP, ModuleCategory.WORLD, ModuleCategory.MOVEMENT, ModuleCategory.SOCIAL,
		ModuleCategory.MISC, ModuleCategory.SETTINGS
	};

	private final Screen parent;
	private ModuleCategory tab = ModuleCategory.HOME;
	private String search = "";
	private boolean searchFocused;
	private int scroll;
	private int maxScroll;
	private Module expanded;
	private Setting<?> listening;
	private ColorSetting picking;
	private float open;
	private long lastNs = System.nanoTime();
	private final List<Hit> hits = new ArrayList<>();
	private NumberSetting dragging;

	public AstralScreen(Screen parent) {
		super(Component.literal(AstralBlaze.FULL_NAME));
		this.parent = parent;
	}

	@Override
	protected void init() {
		open = VisualFlags.reduceMotion || VisualFlags.reduceGuiMotion ? 1F : 0F;
		scroll = 0;
	}

	@Override
	public void renderBackground(GuiGraphics graphics, int mouseX, int mouseY, float partialTick) {
		if (minecraft.level != null) {
			super.renderBackground(graphics, mouseX, mouseY, partialTick);
		} else {
			graphics.fill(0, 0, width, height, 0x66141A24);
		}
	}

	@Override
	public void render(GuiGraphics g, int mouseX, int mouseY, float delta) {
		super.render(g, mouseX, mouseY, delta);
		long now = System.nanoTime();
		float dt = (now - lastNs) / 1_000_000_000F;
		lastNs = now;
		open = GlassRenderer.lerp(open, 1F, Math.min(1F, dt * 10F * GlassRenderer.theme().animationSpeed));
		Theme theme = GlassRenderer.theme();
		hits.clear();

		int sidebar = 214;
		int pad = 16;
		int x = Math.round((1F - open) * -24);
		int y = Math.round((1F - open) * 10);
		GlassRenderer.panel(g, 12 + x, 12 + y, width - 24, height - 24, theme.cornerRadius + 2, ColorUtil.scaleAlpha(theme.panelFill(), 0.55F), theme.border(), theme.shadow());
		GlassRenderer.panel(g, 20 + x, 20 + y, sidebar, height - 40, theme.cornerRadius, theme.sidebar(), theme.border(), 0);

		GlassRenderer.logo(g, 36 + x, 36 + y, 34);
		GlassRenderer.text(g, font, AstralBlaze.NAME, 78 + x, 42 + y, theme.text());
		GlassRenderer.text(g, font, "Client  " + AstralBlaze.VERSION, 78 + x, 56 + y, theme.textMuted());

		int navY = 92 + y;
		for (ModuleCategory cat : TABS) {
			boolean sel = tab == cat && search.isEmpty();
			int itemH = 28;
			boolean hover = inside(mouseX, mouseY, 32 + x, navY, sidebar - 24, itemH);
			int fill = sel ? theme.accentSoft() : (hover ? theme.hover() : 0);
			if (fill != 0) {
				GlassRenderer.rounded(g, 32 + x, navY, sidebar - 24, itemH, 10, fill);
			}
			if (sel) {
				g.fill(32 + x, navY + 7, 35 + x, navY + itemH - 7, theme.accent());
			}
			GlassRenderer.text(g, font, cat.display(), 46 + x, navY + 10, sel ? theme.accent() : theme.text());
			hits.add(new Hit(32 + x, navY, sidebar - 24, itemH, () -> {
				tab = cat;
				search = "";
				searchFocused = false;
				scroll = 0;
				expanded = null;
			}));
			navY += 32;
		}

		int cx = 28 + x + sidebar;
		int cy = 20 + y;
		int cw = width - sidebar - 56;
		int ch = height - 40;
		GlassRenderer.panel(g, cx, cy, cw, ch, theme.cornerRadius, ColorUtil.scaleAlpha(theme.panelFill(), 0.96F), theme.border(), 0);

		drawSearch(g, mouseX, mouseY, cx, cy, cw);
		g.enableScissor(cx + 8, cy + 52, cx + cw - 8, cy + ch - 12);
		int contentY = cy + 56 - scroll;
		if (!search.isEmpty()) {
			contentY = drawModuleGrid(g, mouseX, mouseY, cx + 18, contentY, cw - 36, AstralBlaze.modules().search(search));
		} else if (tab == ModuleCategory.HOME) {
			contentY = drawHome(g, mouseX, mouseY, cx + 18, contentY, cw - 36);
		} else if (tab == ModuleCategory.SETTINGS) {
			contentY = drawSettings(g, mouseX, mouseY, cx + 18, contentY, cw - 36);
		} else if (tab == ModuleCategory.PERFORMANCE) {
			contentY = drawPerformance(g, mouseX, mouseY, cx + 18, contentY, cw - 36);
		} else {
			contentY = drawModuleGrid(g, mouseX, mouseY, cx + 18, contentY, cw - 36, AstralBlaze.modules().of(tab));
		}
		g.disableScissor();
		maxScroll = Math.max(0, contentY - (cy + ch - 20));
		if (picking != null) {
			drawColorPicker(g, mouseX, mouseY, cx + cw - 230, cy + 70);
		}
	}

	private void drawSearch(GuiGraphics g, int mx, int my, int cx, int cy, int cw) {
		Theme theme = GlassRenderer.theme();
		GlassRenderer.text(g, font, search.isEmpty() ? tab.display() : "Search", cx + 18, cy + 18, theme.text());
		int sw = 240;
		int sx = cx + cw - sw - 18;
		int sy = cy + 12;
		GlassRenderer.rounded(g, sx, sy, sw, 28, 10, theme.panelAlt());
		GlassRenderer.rounded(g, sx, sy, sw, 28, 10, searchFocused ? ColorUtil.scaleAlpha(theme.accent(), 0.35F) : theme.border());
		GlassRenderer.rounded(g, sx + 1, sy + 1, sw - 2, 26, 9, theme.panelFill());
		String shown = search.isEmpty() ? "Search modules…" : search + (searchFocused && (System.currentTimeMillis() / 500) % 2 == 0 ? "|" : "");
		GlassRenderer.text(g, font, shown, sx + 12, sy + 10, search.isEmpty() ? theme.textMuted() : theme.text());
		hits.add(new Hit(sx, sy, sw, 28, () -> searchFocused = true));
	}

	private int drawHome(GuiGraphics g, int mx, int my, int x, int y, int w) {
		Theme theme = GlassRenderer.theme();
		GlassRenderer.panel(g, x, y, w, 92, theme.cornerRadius, theme.panelAlt(), theme.border(), 0);
		GlassRenderer.logo(g, x + 18, y + 18, 56);
		GlassRenderer.text(g, font, AstralBlaze.FULL_NAME, x + 88, y + 24, theme.text());
		GlassRenderer.text(g, font, "Minecraft " + AstralBlaze.MC_VERSION + "  ·  Fabric  ·  " + AstralBlaze.VERSION, x + 88, y + 40, theme.textMuted());
		GlassRenderer.text(g, font, "Lightweight HUD, visuals and performance — legitimate by design.", x + 88, y + 56, theme.textMuted());
		y += 108;
		String[][] stats = {
			{"FPS", String.valueOf(ClientStats.fps())},
			{"Ping", ClientStats.pingText()},
			{"RAM", ClientStats.ramText()},
			{"Server", ClientStats.server()},
			{"XYZ", ClientStats.coords()}
		};
		int cardW = (w - 16 * 4) / 5;
		for (int i = 0; i < stats.length; i++) {
			int cx = x + i * (cardW + 16);
			GlassRenderer.panel(g, cx, y, cardW, 58, 12, theme.panelAlt(), theme.border(), 0);
			GlassRenderer.text(g, font, stats[i][0], cx + 12, y + 12, theme.textMuted());
			String val = stats[i][1];
			if (font.width(val) > cardW - 20) {
				val = font.plainSubstrByWidth(val, cardW - 24) + "…";
			}
			GlassRenderer.text(g, font, val, cx + 12, y + 30, theme.text());
		}
		y += 78;
		y = quick(g, x, y, 168, "HUD Editor", () -> minecraft.setScreen(new HudEditorScreen(this)));
		y = quick(g, x + 180, y - 40, 168, "Performance", () -> { tab = ModuleCategory.PERFORMANCE; scroll = 0; }) + 40;
		quick(g, x + 360, y - 40, 140, "Profiles", () -> { tab = ModuleCategory.SETTINGS; scroll = 0; });
		quick(g, x + 516, y - 40, 140, "Themes", () -> { tab = ModuleCategory.SETTINGS; scroll = 0; });
		return y + 8;
	}

	private int quick(GuiGraphics g, int x, int y, int w, String label, Runnable action) {
		Theme theme = GlassRenderer.theme();
		GlassRenderer.panel(g, x, y, w, 34, 12, theme.accentSoft(), theme.border(), 0);
		GlassRenderer.centered(g, font, label, x + w / 2, y + 13, theme.accent());
		hits.add(new Hit(x, y, w, 34, action));
		return y + 40;
	}

	private int drawPerformance(GuiGraphics g, int mx, int my, int x, int y, int w) {
		Theme theme = GlassRenderer.theme();
		var mc = minecraft;
		String[][] rows = {
			{"FPS", String.valueOf(ClientStats.fps())},
			{"Frame time", String.format(Locale.ROOT, "%.2f ms", ClientStats.frameMs())},
			{"Min FPS", String.valueOf(ClientStats.minFps())},
			{"Avg FPS", String.valueOf(Math.round(ClientStats.avgFps()))},
			{"Max FPS", String.valueOf(ClientStats.maxFps())},
			{"RAM", ClientStats.ramText()},
			{"Allocated", (Runtime.getRuntime().totalMemory() / 1024 / 1024) + " MB"},
			{"Entities", String.valueOf(ClientStats.entityCount(mc))},
			{"Render distance", String.valueOf(mc.options.getEffectiveRenderDistance())},
			{"Simulation distance", String.valueOf(mc.options.simulationDistance().get())}
		};
		int col = (w - 16) / 2;
		for (int i = 0; i < rows.length; i++) {
			int cx = x + (i % 2) * (col + 16);
			int cy = y + (i / 2) * 46;
			GlassRenderer.panel(g, cx, cy, col, 38, 10, theme.panelAlt(), theme.border(), 0);
			GlassRenderer.text(g, font, rows[i][0], cx + 12, cy + 14, theme.textMuted());
			GlassRenderer.text(g, font, rows[i][1], cx + col - 12 - font.width(rows[i][1]), cy + 14, theme.text());
		}
		y += ((rows.length + 1) / 2) * 46 + 12;
		return drawModuleGrid(g, mx, my, x, y, w, AstralBlaze.modules().of(ModuleCategory.PERFORMANCE));
	}

	private int drawSettings(GuiGraphics g, int mx, int my, int x, int y, int w) {
		Theme theme = GlassRenderer.theme();
		GlassRenderer.text(g, font, "Themes", x, y, theme.text());
		y += 16;
		int tx = x;
		for (Theme.Preset preset : Theme.Preset.values()) {
			boolean sel = theme.preset == preset;
			int bw = 108;
			GlassRenderer.panel(g, tx, y, bw, 32, 10, sel ? theme.accentSoft() : theme.panelAlt(), sel ? theme.accent() : theme.border(), 0);
			GlassRenderer.centered(g, font, preset.display(), tx + bw / 2, y + 12, sel ? theme.accent() : theme.text());
			hits.add(new Hit(tx, y, bw, 32, () -> AstralBlaze.themes().apply(preset)));
			tx += bw + 10;
		}
		y += 48;
		GlassRenderer.text(g, font, "Accent", x, y, theme.text());
		y += 18;
		int[] swatches = {0xFF5B7CFA, 0xFF4DB6A5, 0xFFE08A4A, 0xFFD36B8A, 0xFF6C8EBF, 0xFF3E3E44};
		for (int i = 0; i < swatches.length; i++) {
			int sx = x + i * 34;
			GlassRenderer.rounded(g, sx, y, 26, 26, 8, swatches[i]);
			int col = swatches[i];
			hits.add(new Hit(sx, y, 26, 26, () -> AstralBlaze.themes().setAccent(col)));
		}
		y += 42;
		y = sliderRow(g, mx, my, x, y, w, "Background opacity", theme.backgroundOpacity, v -> theme.backgroundOpacity = v);
		y = sliderRow(g, mx, my, x, y, w, "Panel opacity", theme.panelOpacity, v -> theme.panelOpacity = v);
		y = sliderRow(g, mx, my, x, y, w, "Border opacity", theme.borderOpacity, v -> theme.borderOpacity = v);
		y = sliderRow(g, mx, my, x, y, w, "Corner radius", theme.cornerRadius / 24F, v -> theme.cornerRadius = Math.max(4, Math.round(v * 24f)));
		y = sliderRow(g, mx, my, x, y, w, "Blur strength", theme.blurStrength, v -> theme.blurStrength = v);
		y = sliderRow(g, mx, my, x, y, w, "Shadow strength", theme.shadowStrength, v -> theme.shadowStrength = v);
		y = sliderRow(g, mx, my, x, y, w, "Animation speed", theme.animationSpeed / 2F, v -> theme.animationSpeed = v * 2F);
		y += 8;
		boolean motion = VisualFlags.reduceMotion;
		GlassRenderer.panel(g, x, y, w, 36, 10, theme.panelAlt(), theme.border(), 0);
		GlassRenderer.text(g, font, "Reduce Motion", x + 14, y + 13, theme.text());
		drawToggle(g, x + w - 54, y + 8, motion);
		hits.add(new Hit(x, y, w, 36, () -> {
			VisualFlags.reduceMotion = !VisualFlags.reduceMotion;
			AstralBlaze.config().markDirty();
		}));
		y += 52;
		GlassRenderer.text(g, font, "Profiles", x, y, theme.text());
		y += 18;
		for (String name : AstralBlaze.profiles().names()) {
			boolean active = name.equals(AstralBlaze.profiles().activeName());
			GlassRenderer.panel(g, x, y, w, 32, 10, active ? theme.accentSoft() : theme.panelAlt(), theme.border(), 0);
			GlassRenderer.text(g, font, name + (active ? "  ·  active" : ""), x + 12, y + 12, theme.text());
			hits.add(new Hit(x, y, w - 220, 32, () -> AstralBlaze.profiles().load(name)));
			smallBtn(g, x + w - 200, y + 5, 60, "Save", () -> AstralBlaze.profiles().save(name));
			smallBtn(g, x + w - 132, y + 5, 60, "Copy", () -> AstralBlaze.profiles().duplicate(name, name + " copy"));
			smallBtn(g, x + w - 64, y + 5, 52, "Del", () -> AstralBlaze.profiles().delete(name));
			y += 38;
		}
		y += 8;
		GlassRenderer.text(g, font, "Keybinds", x, y, theme.text());
		y += 16;
		for (String issue : AstralBlaze.keys().conflicts()) {
			GlassRenderer.text(g, font, issue, x, y, theme.danger());
			y += 12;
		}
		GlassRenderer.text(g, font, "Menu  ·  " + AstralBlaze.keys().menu.getTranslatedKeyMessage().getString(), x, y, theme.textMuted());
		y += 14;
		GlassRenderer.text(g, font, "HUD Editor  ·  " + AstralBlaze.keys().hudEditor.getTranslatedKeyMessage().getString(), x, y, theme.textMuted());
		y += 14;
		GlassRenderer.text(g, font, "Zoom  ·  " + AstralBlaze.keys().zoom.getTranslatedKeyMessage().getString(), x, y, theme.textMuted());
		y += 18;
		GlassRenderer.text(g, font, "Change binds in Options → Controls → Astral Blaze.", x, y, theme.textMuted());
		return y + 24;
	}

	private int sliderRow(GuiGraphics g, int mx, int my, int x, int y, int w, String label, float value, java.util.function.Consumer<Float> setter) {
		Theme theme = GlassRenderer.theme();
		GlassRenderer.text(g, font, label, x, y, theme.textMuted());
		int sx = x + 160;
		int sw = w - 160;
		GlassRenderer.rounded(g, sx, y + 4, sw, 6, 3, theme.panelAlt());
		int fill = Math.round(sw * Mth.clamp(value, 0, 1));
		GlassRenderer.rounded(g, sx, y + 4, Math.max(6, fill), 6, 3, theme.accent());
		hits.add(new Hit(sx, y, sw, 16, () -> {
			float v = Mth.clamp((mx - sx) / (float) sw, 0, 1);
			setter.accept(v);
			AstralBlaze.config().markDirty();
		}));
		return y + 22;
	}

	private void smallBtn(GuiGraphics g, int x, int y, int w, String label, Runnable action) {
		Theme theme = GlassRenderer.theme();
		GlassRenderer.rounded(g, x, y, w, 22, 8, theme.panelFill());
		GlassRenderer.centered(g, font, label, x + w / 2, y + 7, theme.text());
		hits.add(new Hit(x, y, w, 22, action));
	}

	private int drawModuleGrid(GuiGraphics g, int mx, int my, int x, int y, int w, List<Module> modules) {
		if (modules.isEmpty()) {
			GlassRenderer.text(g, font, "Nothing matches that search.", x, y + 8, GlassRenderer.theme().textMuted());
			return y + 28;
		}
		int colW = (w - 14) / 2;
		int i = 0;
		int rowY = y;
		int maxBottom = y;
		for (Module module : modules) {
			int cx = x + (i % 2) * (colW + 14);
			int cy = rowY;
			int h = drawModuleCard(g, mx, my, cx, cy, colW, module);
			maxBottom = Math.max(maxBottom, cy + h + 12);
			if (i % 2 == 1) {
				rowY = maxBottom;
			}
			i++;
		}
		if (i % 2 == 1) {
			rowY = maxBottom;
		}
		return rowY;
	}

	private int drawModuleCard(GuiGraphics g, int mx, int my, int x, int y, int w, Module module) {
		Theme theme = GlassRenderer.theme();
		boolean openCard = expanded == module;
		int h = openCard ? 86 + module.settings().size() * 28 : 72;
		GlassRenderer.panel(g, x, y, w, h, 14, theme.panelAlt(), module.enabled() ? ColorUtil.scaleAlpha(theme.accent(), 0.55F) : theme.border(), 0);
		GlassRenderer.text(g, font, module.name(), x + 14, y + 12, theme.text());
		drawWrapped(g, module.description(), x + 14, y + 28, w - 70, theme.textMuted());
		drawToggle(g, x + w - 52, y + 14, module.enabled());
		hits.add(new Hit(x + w - 56, y + 10, 44, 24, module::toggle));
		hits.add(new Hit(x, y, w - 60, 56, () -> expanded = openCard ? null : module));
		if (openCard) {
			int sy = y + 58;
			for (Setting<?> setting : module.settings()) {
				sy = drawSetting(g, mx, my, x + 14, sy, w - 28, setting);
			}
			h = sy - y + 10;
		}
		return h;
	}

	private int drawSetting(GuiGraphics g, int mx, int my, int x, int y, int w, Setting<?> setting) {
		Theme theme = GlassRenderer.theme();
		GlassRenderer.text(g, font, setting.name(), x, y + 6, theme.text());
		if (setting instanceof BooleanSetting bool) {
			drawToggle(g, x + w - 40, y, bool.get());
			hits.add(new Hit(x, y, w, 22, bool::toggle));
		} else if (setting instanceof NumberSetting num) {
			int sx = x + 110;
			int sw = w - 110;
			float t = (float) ((num.get() - num.min()) / (num.max() - num.min()));
			GlassRenderer.rounded(g, sx, y + 8, sw, 6, 3, theme.panelFill());
			GlassRenderer.rounded(g, sx, y + 8, Math.max(6, Math.round(sw * t)), 6, 3, theme.accent());
			hits.add(new Hit(sx, y, sw, 20, () -> {
				dragging = num;
				applySlider(num, mx, sx, sw);
			}));
		} else if (setting instanceof EnumSetting<?> en) {
			String label = EnumSetting.display(en.get());
			GlassRenderer.rounded(g, x + w - 108, y + 2, 108, 20, 8, theme.panelFill());
			GlassRenderer.centered(g, font, label, x + w - 54, y + 8, theme.text());
			hits.add(new Hit(x + w - 108, y, 108, 22, en::cycle));
		} else if (setting instanceof ColorSetting col) {
			GlassRenderer.rounded(g, x + w - 28, y + 4, 20, 16, 5, col.get());
			hits.add(new Hit(x + w - 32, y, 32, 22, () -> picking = picking == col ? null : col));
		} else if (setting instanceof KeybindSetting key) {
			String label = listening == key ? "Press a key" : key.label();
			GlassRenderer.rounded(g, x + w - 90, y + 2, 90, 20, 8, theme.panelFill());
			GlassRenderer.centered(g, font, label, x + w - 45, y + 8, theme.text());
			hits.add(new Hit(x + w - 90, y, 90, 22, () -> listening = key));
		}
		return y + 26;
	}

	private void drawToggle(GuiGraphics g, int x, int y, boolean on) {
		Theme theme = GlassRenderer.theme();
		int bg = on ? theme.accent() : ColorUtil.scaleAlpha(theme.textMuted(), 0.35F);
		GlassRenderer.rounded(g, x, y, 34, 18, 9, bg);
		int kx = on ? x + 18 : x + 2;
		GlassRenderer.rounded(g, kx, y + 2, 14, 14, 7, 0xFFFFFFFF);
	}

	private void drawWrapped(GuiGraphics g, String text, int x, int y, int w, int color) {
		String a = text;
		if (font.width(a) > w) {
			a = font.plainSubstrByWidth(a, w - 8) + "…";
		}
		GlassRenderer.text(g, font, a, x, y, color);
		if (text.length() > a.length()) {
			String rest = text.substring(Math.min(text.length(), a.length() - 1));
			if (font.width(rest) > w) {
				rest = font.plainSubstrByWidth(rest, w - 8) + "…";
			}
			GlassRenderer.text(g, font, rest, x, y + 11, color);
		}
	}

	private void drawColorPicker(GuiGraphics g, int mx, int my, int x, int y) {
		Theme theme = GlassRenderer.theme();
		GlassRenderer.panel(g, x, y, 210, 168, 12, theme.panelFill(), theme.border(), theme.shadow());
		float[] hsv = ColorUtil.rgbToHsv(picking.get());
		for (int i = 0; i < 160; i++) {
			int hue = ColorUtil.hsva(i / 160F * 360F, 1F, 1F, 255);
			g.fill(x + 16 + i, y + 16, x + 17 + i, y + 28, hue);
		}
		hits.add(new Hit(x + 16, y + 16, 160, 12, () -> {
			float h = Mth.clamp((mx - (x + 16)) / 160F, 0, 1) * 360F;
			float[] cur = ColorUtil.rgbToHsv(picking.get());
			picking.set(ColorUtil.hsva(h, cur[1], cur[2], 255));
		}));
		int satW = 160, satH = 96;
		for (int sy = 0; sy < satH; sy += 4) {
			for (int sx = 0; sx < satW; sx += 4) {
				int col = ColorUtil.hsva(hsv[0], sx / (float) satW, 1F - sy / (float) satH, 255);
				g.fill(x + 16 + sx, y + 40 + sy, x + 20 + sx, y + 44 + sy, col);
			}
		}
		hits.add(new Hit(x + 16, y + 40, satW, satH, () -> {
			float s = Mth.clamp((mx - (x + 16)) / (float) satW, 0, 1);
			float v = 1F - Mth.clamp((my - (y + 40)) / (float) satH, 0, 1);
			picking.set(ColorUtil.hsva(hsv[0], s, v, 255));
		}));
	}

	private void applySlider(NumberSetting num, int mx, int sx, int sw) {
		float t = Mth.clamp((mx - sx) / (float) sw, 0, 1);
		num.set(num.min() + t * (num.max() - num.min()));
	}

	@Override
	public boolean mouseClicked(MouseButtonEvent event, boolean doubled) {
		int mx = (int) event.x();
		int my = (int) event.y();
		searchFocused = false;
		if (event.button() != 0) {
			return super.mouseClicked(event, doubled);
		}
		for (int i = hits.size() - 1; i >= 0; i--) {
			Hit hit = hits.get(i);
			if (inside(mx, my, hit.x, hit.y, hit.w, hit.h)) {
				hit.action.run();
				return true;
			}
		}
		return super.mouseClicked(event, doubled);
	}

	@Override
	public boolean mouseReleased(MouseButtonEvent event) {
		dragging = null;
		return super.mouseReleased(event);
	}

	@Override
	public boolean mouseDragged(MouseButtonEvent event, double dx, double dy) {
		if (dragging != null) {
			// layout is rebuilt each frame; reuse last hit by applying using current mouse
			return true;
		}
		return super.mouseDragged(event, dx, dy);
	}

	@Override
	public boolean mouseScrolled(double mouseX, double mouseY, double scrollX, double scrollY) {
		scroll = (int) Mth.clamp(scroll - scrollY * 22, 0, Math.max(0, maxScroll));
		return true;
	}

	@Override
	public boolean keyPressed(KeyEvent event) {
		if (listening instanceof KeybindSetting key) {
			if (event.key() == GLFW.GLFW_KEY_ESCAPE) {
				key.set(KeybindSetting.UNBOUND);
			} else {
				key.set(event.key());
			}
			listening = null;
			return true;
		}
		if (searchFocused) {
			if (event.key() == GLFW.GLFW_KEY_BACKSPACE && !search.isEmpty()) {
				search = search.substring(0, search.length() - 1);
				return true;
			}
			if (event.key() == GLFW.GLFW_KEY_ESCAPE) {
				searchFocused = false;
				return true;
			}
		}
		return super.keyPressed(event);
	}

	@Override
	public boolean charTyped(CharacterEvent event) {
		if (searchFocused && event.isAllowedChatCharacter()) {
			search += event.codepointAsString();
			scroll = 0;
			return true;
		}
		return super.charTyped(event);
	}

	@Override
	public void onClose() {
		minecraft.setScreen(parent instanceof AstralScreen ? null : parent);
		AstralBlaze.config().saveNow();
	}

	@Override
	public boolean isPauseScreen() {
		return false;
	}

	private static boolean inside(int mx, int my, int x, int y, int w, int h) {
		return mx >= x && my >= y && mx <= x + w && my <= y + h;
	}

	private record Hit(int x, int y, int w, int h, Runnable action) {
	}
}
