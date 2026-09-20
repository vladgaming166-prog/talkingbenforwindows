package dev.astralblaze.client.mixin;

import dev.astralblaze.client.flags.VisualFlags;
import net.minecraft.client.renderer.LightTexture;
import net.minecraft.world.level.dimension.DimensionType;
import org.spongepowered.asm.mixin.Mixin;
import org.spongepowered.asm.mixin.injection.At;
import org.spongepowered.asm.mixin.injection.Inject;
import org.spongepowered.asm.mixin.injection.callback.CallbackInfoReturnable;

@Mixin(LightTexture.class)
public abstract class LightTextureMixin {
	@Inject(method = "getBrightness(Lnet/minecraft/world/level/dimension/DimensionType;I)F", at = @At("HEAD"), cancellable = true)
	private static void astral$fullbrightDim(DimensionType type, int lightLevel, CallbackInfoReturnable<Float> cir) {
		if (VisualFlags.fullbright) {
			cir.setReturnValue(1.0F);
		}
	}

	@Inject(method = "getBrightness(FI)F", at = @At("HEAD"), cancellable = true)
	private static void astral$fullbright(float ambient, int lightLevel, CallbackInfoReturnable<Float> cir) {
		if (VisualFlags.fullbright) {
			cir.setReturnValue(1.0F);
		}
	}
}
