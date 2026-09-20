package dev.astralblaze.client.mixin;

import dev.astralblaze.client.flags.VisualFlags;
import net.minecraft.client.Camera;
import net.minecraft.client.renderer.GameRenderer;
import com.mojang.blaze3d.vertex.PoseStack;
import org.spongepowered.asm.mixin.Mixin;
import org.spongepowered.asm.mixin.injection.At;
import org.spongepowered.asm.mixin.injection.Inject;
import org.spongepowered.asm.mixin.injection.callback.CallbackInfo;
import org.spongepowered.asm.mixin.injection.callback.CallbackInfoReturnable;

@Mixin(GameRenderer.class)
public abstract class GameRendererMixin {
	@Inject(method = "getFov", at = @At("RETURN"), cancellable = true)
	private void astral$zoom(Camera camera, float partialTick, boolean applyFov, CallbackInfoReturnable<Float> cir) {
		if (VisualFlags.zoomFovMul != 1.0F) {
			cir.setReturnValue(cir.getReturnValueF() * VisualFlags.zoomFovMul);
		}
	}

	@Inject(method = "bobHurt", at = @At("HEAD"), cancellable = true)
	private void astral$noHurt(PoseStack poseStack, float partialTick, CallbackInfo ci) {
		if (VisualFlags.noHurtCam) {
			ci.cancel();
		}
	}

	@Inject(method = "bobView", at = @At("HEAD"), cancellable = true)
	private void astral$noBob(PoseStack poseStack, float partialTick, CallbackInfo ci) {
		if (VisualFlags.noViewBob) {
			ci.cancel();
		}
	}
}
