package dev.astralblaze.client;

import dev.astralblaze.client.flags.VisualFlags;
import dev.astralblaze.client.input.CpsTracker;
import dev.astralblaze.client.perf.ClientStats;
import dev.astralblaze.client.ui.AstralScreen;
import net.fabricmc.api.ClientModInitializer;
import net.fabricmc.fabric.api.client.event.lifecycle.v1.ClientTickEvents;
import net.fabricmc.fabric.api.client.rendering.v1.hud.HudElementRegistry;
import net.fabricmc.fabric.api.client.rendering.v1.hud.VanillaHudElements;
import net.minecraft.util.Util;
import net.minecraft.resources.Identifier;

public final class AstralBlazeClient implements ClientModInitializer {
	private long lastFrameNs;

	@Override
	public void onInitializeClient() {
		AstralBlaze.bootstrap();
		HudElementRegistry.attachElementAfter(VanillaHudElements.MISC_OVERLAYS, Identifier.fromNamespaceAndPath(AstralBlaze.MOD_ID, "crosshair"), (graphics, delta) -> {
			if (AstralBlaze.hud() != null && AstralBlaze.hud().crosshair() != null && AstralBlaze.hud().crosshair().enabled()) {
				var mc = net.minecraft.client.Minecraft.getInstance();
				AstralBlaze.hud().crosshair().renderCentered(graphics, mc, mc.getWindow().getGuiScaledWidth(), mc.getWindow().getGuiScaledHeight());
			}
		});
		HudElementRegistry.addLast(Identifier.fromNamespaceAndPath(AstralBlaze.MOD_ID, "hud"), (graphics, delta) -> {
			var mc = net.minecraft.client.Minecraft.getInstance();
			ClientStats.onFrame();
			long now = Util.getNanos();
			float dt = lastFrameNs == 0 ? 0.016F : (now - lastFrameNs) / 1_000_000_000F;
			lastFrameNs = now;
			if (dt > 0.1F) dt = 0.1F;
			VisualFlags.tickZoom(dt);
			if (mc.screen instanceof AstralScreen) {
				return;
			}
			AstralBlaze.hud().render(graphics, mc, mc.screen instanceof dev.astralblaze.client.ui.HudEditorScreen);
			AstralBlaze.toasts().render(graphics, mc.getWindow().getGuiScaledWidth(), mc.getWindow().getGuiScaledHeight());
		});
		ClientTickEvents.END_CLIENT_TICK.register(client -> {
			CpsTracker.poll(client);
			ClientStats.onTick(client);
			AstralBlaze.modules().tick(client);
			AstralBlaze.config().tickSave();
		});
	}
}
