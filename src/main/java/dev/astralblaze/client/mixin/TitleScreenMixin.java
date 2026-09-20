package dev.astralblaze.client.mixin;

import dev.astralblaze.client.AstralBlaze;
import dev.astralblaze.client.ui.AstralScreen;
import dev.astralblaze.client.ui.GlassTextButton;
import dev.astralblaze.client.ui.render.GlassRenderer;
import net.minecraft.client.gui.GuiGraphics;
import net.minecraft.client.gui.screens.TitleScreen;
import net.minecraft.client.gui.screens.Screen;
import net.minecraft.network.chat.Component;
import org.spongepowered.asm.mixin.Mixin;
import org.spongepowered.asm.mixin.injection.At;
import org.spongepowered.asm.mixin.injection.Inject;
import org.spongepowered.asm.mixin.injection.callback.CallbackInfo;

@Mixin(TitleScreen.class)
public abstract class TitleScreenMixin extends Screen {
	protected TitleScreenMixin(Component title) {
		super(title);
	}

	@Inject(method = "init", at = @At("TAIL"))
	private void astral$init(CallbackInfo ci) {
		int bw = 200;
		int bx = this.width / 2 - bw / 2;
		int by = this.height / 4 + 48 + 96;
		this.addRenderableWidget(new GlassTextButton(bx, by, bw, 24, Component.literal("Astral Blaze Settings"), () -> {
			if (this.minecraft != null) {
				this.minecraft.setScreen(new AstralScreen(this));
			}
		}));
	}

	@Inject(method = "renderBackground", at = @At("HEAD"), cancellable = true)
	private void astral$background(GuiGraphics graphics, int mouseX, int mouseY, float delta, CallbackInfo ci) {
		if (AstralBlaze.modules() != null && AstralBlaze.modules().menuBackground().render(graphics, this.width, this.height, delta)) {
			ci.cancel();
		}
	}

	@Inject(method = "render", at = @At("TAIL"))
	private void astral$brand(GuiGraphics graphics, int mouseX, int mouseY, float delta, CallbackInfo ci) {
		GlassRenderer.panel(graphics, 16, 16, 196, 52, 14, GlassRenderer.theme().panelFill(), GlassRenderer.theme().border(), GlassRenderer.theme().shadow());
		GlassRenderer.logo(graphics, 26, 24, 36);
		GlassRenderer.text(graphics, this.font, AstralBlaze.NAME, 70, 28, GlassRenderer.theme().text());
		GlassRenderer.text(graphics, this.font, AstralBlaze.VERSION + "  ·  MC " + AstralBlaze.MC_VERSION, 70, 44, GlassRenderer.theme().textMuted());
	}
}
