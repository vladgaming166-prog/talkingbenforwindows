package dev.astralblaze.client.module.misc;

import com.google.gson.JsonObject;
import dev.astralblaze.client.AstralBlaze;
import dev.astralblaze.client.core.Module;
import dev.astralblaze.client.core.ModuleCategory;
import dev.astralblaze.client.core.setting.ColorSetting;
import dev.astralblaze.client.core.setting.EnumSetting;
import dev.astralblaze.client.ui.render.ColorUtil;
import dev.astralblaze.client.ui.render.GlassRenderer;
import net.minecraft.util.Util;
import net.minecraft.client.Minecraft;
import net.minecraft.client.gui.GuiGraphics;
import net.minecraft.client.renderer.RenderPipelines;
import net.minecraft.client.renderer.texture.DynamicTexture;
import net.minecraft.resources.Identifier;
import net.minecraft.util.Mth;

import javax.imageio.ImageIO;
import java.awt.image.BufferedImage;
import java.io.IOException;
import java.io.InputStream;
import java.nio.file.DirectoryStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;

public final class MenuBackgroundModule extends Module {
	public enum Mode { PANORAMA, CUSTOM_IMAGE, SOLID, GRADIENT, ANIMATED }

	public final EnumSetting<Mode> mode = add(new EnumSetting<>("Mode", "Title screen background style.", Mode.PANORAMA));
	public final ColorSetting solid = add(new ColorSetting("Solid color", "Used by solid mode.", 0xFFF4F6FB));
	public final ColorSetting gradientA = add(new ColorSetting("Gradient top", "Top of the lightweight gradient.", 0xFFF7F8FC));
	public final ColorSetting gradientB = add(new ColorSetting("Gradient bottom", "Bottom of the lightweight gradient.", 0xFFE4E9F6));

	private Identifier cachedImage;
	private String cachedPath = "";
	private int imgW = 16, imgH = 16;

	public MenuBackgroundModule() {
		super("Menu Background", "Panorama, custom image, solid, gradient or a lightweight animated wash.", ModuleCategory.MISC, true);
	}

	public boolean render(GuiGraphics g, int width, int height, float delta) {
		if (!enabled()) {
			return false;
		}
		return switch (mode.get()) {
			case PANORAMA -> false;
			case CUSTOM_IMAGE -> {
				Identifier tex = image();
				if (tex == null) {
					drawGradient(g, width, height);
				} else {
					g.blit(RenderPipelines.GUI_TEXTURED, tex, 0, 0, 0, 0, width, height, width, height, imgW, imgH);
				}
				yield true;
			}
			case SOLID -> {
				g.fill(0, 0, width, height, solid.get());
				yield true;
			}
			case GRADIENT -> {
				drawGradient(g, width, height);
				yield true;
			}
			case ANIMATED -> {
				drawAnimated(g, width, height);
				yield true;
			}
		};
	}

	private void drawGradient(GuiGraphics g, int w, int h) {
		g.fillGradient(0, 0, w, h, gradientA.get(), gradientB.get());
	}

	private void drawAnimated(GuiGraphics g, int w, int h) {
		drawGradient(g, w, h);
		float t = Util.getMillis() / 1000F;
		int accent = ColorUtil.scaleAlpha(GlassRenderer.theme().accent(), 0.18F);
		int soft = ColorUtil.scaleAlpha(0xFFFFFFFF, 0.22F);
		int r1 = Math.min(w, h) / 3;
		int r2 = Math.min(w, h) / 4;
		int x1 = (int) (w * 0.25F + Mth.sin(t * 0.35F) * 40);
		int y1 = (int) (h * 0.30F + Mth.cos(t * 0.28F) * 30);
		int x2 = (int) (w * 0.70F + Mth.cos(t * 0.22F) * 50);
		int y2 = (int) (h * 0.62F + Mth.sin(t * 0.31F) * 24);
		GlassRenderer.rounded(g, x1 - r1, y1 - r1, r1 * 2, r1 * 2, 24, accent);
		GlassRenderer.rounded(g, x2 - r2, y2 - r2, r2 * 2, r2 * 2, 24, soft);
	}

	private Identifier image() {
		Path dir = AstralBlaze.config().backgrounds();
		Path chosen = firstImage(dir);
		if (chosen == null) {
			return null;
		}
		String path = chosen.toAbsolutePath().toString();
		if (path.equals(cachedPath) && cachedImage != null) {
			return cachedImage;
		}
		try (InputStream in = Files.newInputStream(chosen)) {
			BufferedImage img = ImageIO.read(in);
			if (img == null) {
				return null;
			}
			var nativeImage = new com.mojang.blaze3d.platform.NativeImage(img.getWidth(), img.getHeight(), false);
			for (int y = 0; y < img.getHeight(); y++) {
				for (int x = 0; x < img.getWidth(); x++) {
					int argb = img.getRGB(x, y);
					nativeImage.setPixel(x, y, argb);
				}
			}
			Identifier id = AstralBlaze.id("dynamic/menu_background");
			DynamicTexture tex = new DynamicTexture(() -> "astralblaze-bg", nativeImage);
			Minecraft.getInstance().getTextureManager().register(id, tex);
			cachedImage = id;
			cachedPath = path;
			imgW = img.getWidth();
			imgH = img.getHeight();
			return id;
		} catch (IOException e) {
			return null;
		}
	}

	private static Path firstImage(Path dir) {
		if (!Files.isDirectory(dir)) {
			return null;
		}
		List<Path> found = new ArrayList<>();
		try (DirectoryStream<Path> stream = Files.newDirectoryStream(dir)) {
			for (Path p : stream) {
				String n = p.getFileName().toString().toLowerCase(Locale.ROOT);
				if (n.endsWith(".png") || n.endsWith(".jpg") || n.endsWith(".jpeg")) {
					found.add(p);
				}
			}
		} catch (IOException ignored) {
		}
		found.sort(Path::compareTo);
		return found.isEmpty() ? null : found.get(0);
	}

	@Override
	public JsonObject toJson() {
		return super.toJson();
	}
}
