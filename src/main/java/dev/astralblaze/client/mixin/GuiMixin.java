package dev.astralblaze.client.mixin;

import dev.astralblaze.client.flags.VisualFlags;
import net.minecraft.client.DeltaTracker;
import net.minecraft.client.gui.Gui;
import net.minecraft.client.gui.GuiGraphics;
import net.minecraft.resources.Identifier;
import net.minecraft.world.entity.Entity;
import org.spongepowered.asm.mixin.Mixin;
import org.spongepowered.asm.mixin.injection.At;
import org.spongepowered.asm.mixin.injection.Inject;
import org.spongepowered.asm.mixin.injection.callback.CallbackInfo;

@Mixin(Gui.class)
public abstract class GuiMixin {
	@Inject(method = "renderVignette", at = @At("HEAD"), cancellable = true)
	private void astral$vignette(GuiGraphics graphics, Entity entity, CallbackInfo ci) {
		if (VisualFlags.noVignette) {
			ci.cancel();
		}
	}

	@Inject(method = "renderTextureOverlay", at = @At("HEAD"), cancellable = true)
	private void astral$pumpkin(GuiGraphics graphics, Identifier texture, float opacity, CallbackInfo ci) {
		if (VisualFlags.noPumpkinOverlay && texture != null && texture.getPath().contains("pumpkin")) {
			ci.cancel();
		}
	}

	@Inject(method = "renderCrosshair", at = @At("HEAD"), cancellable = true)
	private void astral$crosshair(GuiGraphics graphics, DeltaTracker deltaTracker, CallbackInfo ci) {
		if (VisualFlags.customCrosshair) {
			ci.cancel();
		}
	}
}
