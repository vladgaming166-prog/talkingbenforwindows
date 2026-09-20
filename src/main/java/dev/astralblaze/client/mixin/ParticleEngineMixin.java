package dev.astralblaze.client.mixin;

import dev.astralblaze.client.flags.VisualFlags;
import net.minecraft.client.particle.Particle;
import net.minecraft.client.particle.ParticleEngine;
import org.spongepowered.asm.mixin.Mixin;
import org.spongepowered.asm.mixin.injection.At;
import org.spongepowered.asm.mixin.injection.Inject;
import org.spongepowered.asm.mixin.injection.callback.CallbackInfo;

@Mixin(ParticleEngine.class)
public abstract class ParticleEngineMixin {
	@Inject(method = "add", at = @At("HEAD"), cancellable = true)
	private void astral$particles(Particle particle, CallbackInfo ci) {
		float chance = VisualFlags.particleChance;
		if (chance >= 0.999F) {
			return;
		}
		if (chance <= 0.001F || (particle != null && (System.identityHashCode(particle) & 1023) / 1023F > chance)) {
			ci.cancel();
		}
	}
}
