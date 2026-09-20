package dev.astralblaze.client.hud.elements;

import dev.astralblaze.client.core.ModuleCategory;
import dev.astralblaze.client.core.setting.BooleanSetting;
import dev.astralblaze.client.core.setting.EnumSetting;
import dev.astralblaze.client.core.setting.NumberSetting;
import dev.astralblaze.client.hud.HudElement;
import dev.astralblaze.client.theme.Theme;
import dev.astralblaze.client.ui.render.ColorUtil;
import dev.astralblaze.client.ui.render.GlassRenderer;
import net.minecraft.client.Minecraft;
import net.minecraft.client.gui.GuiGraphics;
import net.minecraft.world.entity.EquipmentSlot;
import net.minecraft.world.item.ItemStack;

public final class ArmorHud extends HudElement {
	public enum Layout { VERTICAL, HORIZONTAL }

	private final EnumSetting<Layout> layout = add(new EnumSetting<>("Layout", "Armor arrangement.", Layout.VERTICAL));
	private final BooleanSetting durability = add(new BooleanSetting("Durability", "Show remaining durability.", true));
	private final BooleanSetting counts = add(new BooleanSetting("Item count", "Show stack size for the held item.", true));
	private final BooleanSetting held = add(new BooleanSetting("Held item", "Include the currently held item.", true));
	private final NumberSetting spacingSet = add(new NumberSetting("Spacing", "Gap between slots.", 2, 0, 12, 1));

	public ArmorHud() {
		super("Armor", "Helmet, chestplate, leggings, boots and held item.", ModuleCategory.HUD, true, 0.92F, 0.28F);
	}

	@Override
	protected int[] renderContent(GuiGraphics g, Minecraft mc, float tickDelta, boolean editor) {
		if (mc.player == null) {
			return new int[]{20, 20};
		}
		ItemStack[] stacks = {
			mc.player.getItemBySlot(EquipmentSlot.HEAD),
			mc.player.getItemBySlot(EquipmentSlot.CHEST),
			mc.player.getItemBySlot(EquipmentSlot.LEGS),
			mc.player.getItemBySlot(EquipmentSlot.FEET),
			held.get() ? mc.player.getMainHandItem() : ItemStack.EMPTY
		};
		int gap = spacingSet.intValue();
		int slot = 18;
		int extra = durability.get() ? 22 : 0;
		boolean horiz = layout.get() == Layout.HORIZONTAL;
		int count = held.get() ? 5 : 4;
		int w = horiz ? count * (slot + extra + gap) - gap : slot + extra + 4;
		int h = horiz ? slot + 6 : count * (slot + gap) - gap + 4;
		Theme theme = GlassRenderer.theme();
		float op = opacity.floatValue();
		if (background.get() && style.get() != Style.TEXT_ONLY) {
			GlassRenderer.panel(g, 0, 0, w, h, radius.intValue(), ColorUtil.scaleAlpha(theme.panelFill(), op), border.get() ? ColorUtil.scaleAlpha(theme.border(), op) : 0, 0);
		}
		int x = 2, y = 2;
		for (int i = 0; i < count; i++) {
			ItemStack stack = stacks[i];
			if (!stack.isEmpty()) {
				g.renderItem(stack, x, y);
				g.renderItemDecorations(mc.font, stack, x, y, counts.get() ? null : "");
				if (durability.get() && stack.isDamageableItem()) {
					int max = stack.getMaxDamage();
					int left = max - stack.getDamageValue();
					GlassRenderer.text(g, mc.font, String.valueOf(left), x + 18, y + 4, ColorUtil.scaleAlpha(color.get(), op));
				}
			}
			if (horiz) {
				x += slot + extra + gap;
			} else {
				y += slot + gap;
			}
		}
		return new int[]{w, h};
	}
}
