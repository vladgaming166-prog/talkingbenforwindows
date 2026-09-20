package dev.astralblaze.client.mixin;

import dev.astralblaze.client.ui.AstralScreen;
import dev.astralblaze.client.ui.GlassTextButton;
import net.minecraft.client.gui.screens.PauseScreen;
import net.minecraft.client.gui.screens.Screen;
import net.minecraft.network.chat.Component;
import org.spongepowered.asm.mixin.Mixin;
import org.spongepowered.asm.mixin.Shadow;
import org.spongepowered.asm.mixin.injection.At;
import org.spongepowered.asm.mixin.injection.Inject;
import org.spongepowered.asm.mixin.injection.callback.CallbackInfo;

@Mixin(PauseScreen.class)
public abstract class PauseScreenMixin extends Screen {
	@Shadow
	public abstract boolean showsPauseMenu();

	protected PauseScreenMixin(Component title) {
		super(title);
	}

	@Inject(method = "init", at = @At("TAIL"))
	private void astral$button(CallbackInfo ci) {
		if (!this.showsPauseMenu()) {
			return;
		}
		this.addRenderableWidget(new GlassTextButton(this.width / 2 - 60, 8, 120, 22, Component.literal("Astral Blaze"), () -> {
			if (this.minecraft != null) {
				this.minecraft.setScreen(new AstralScreen(this));
			}
		}));
	}
}
