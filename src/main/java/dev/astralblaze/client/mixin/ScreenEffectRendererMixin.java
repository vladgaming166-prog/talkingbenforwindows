package dev.astralblaze.client.mixin;

import com.mojang.blaze3d.vertex.PoseStack;
import dev.astralblaze.client.flags.VisualFlags;
import net.minecraft.client.renderer.MultiBufferSource;
import net.minecraft.client.renderer.ScreenEffectRenderer;
import net.minecraft.client.renderer.texture.TextureAtlasSprite;
import org.spongepowered.asm.mixin.Mixin;
import org.spongepowered.asm.mixin.injection.At;
import org.spongepowered.asm.mixin.injection.Inject;
import org.spongepowered.asm.mixin.injection.callback.CallbackInfo;

@Mixin(ScreenEffectRenderer.class)
public abstract class ScreenEffectRendererMixin {
	@Inject(method = "renderFire", at = @At("HEAD"), cancellable = true)
	private static void astral$fire(PoseStack poseStack, MultiBufferSource buffer, TextureAtlasSprite sprite, CallbackInfo ci) {
		if (VisualFlags.noFireOverlay) {
			ci.cancel();
		}
	}
}
