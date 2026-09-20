package dev.astralblaze.client.config;

import com.google.gson.Gson;
import com.google.gson.GsonBuilder;
import com.google.gson.JsonObject;
import com.google.gson.JsonParser;
import dev.astralblaze.client.AstralBlaze;
import dev.astralblaze.client.core.Module;
import dev.astralblaze.client.flags.VisualFlags;
import net.fabricmc.loader.api.FabricLoader;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.concurrent.TimeUnit;

public final class ConfigManager {
	private static final Gson GSON = new GsonBuilder().setPrettyPrinting().disableHtmlEscaping().create();
	private final Path root = FabricLoader.getInstance().getConfigDir().resolve("astralblaze");
	private final Path configFile = root.resolve("config.json");
	private final Path hudFile = root.resolve("hud.json");
	private final Path modulesFile = root.resolve("modules.json");
	private final Path themesFile = root.resolve("themes.json");
	private long dirtyAt;
	private boolean dirty;
	private boolean suppress;

	public Path root() {
		return root;
	}

	public Path backgrounds() {
		return root.resolve("backgrounds");
	}

	public void load() {
		try {
			Files.createDirectories(root);
			Files.createDirectories(backgrounds());
			Files.createDirectories(root.resolve("profiles"));
		} catch (IOException ignored) {
		}
		suppress = true;
		readJson(themesFile, obj -> AstralBlaze.themes().fromJson(obj));
		readJson(modulesFile, obj -> {
			for (Module module : AstralBlaze.modules().all()) {
				if (obj.has(module.name()) && obj.get(module.name()).isJsonObject()) {
					module.fromJson(obj.getAsJsonObject(module.name()));
				}
			}
		});
		readJson(hudFile, obj -> AstralBlaze.hud().fromJson(obj));
		readJson(configFile, obj -> {
			if (obj.has("reduceMotion")) VisualFlags.reduceMotion = obj.get("reduceMotion").getAsBoolean();
			if (obj.has("activeProfile")) AstralBlaze.profiles().setActiveName(obj.get("activeProfile").getAsString());
			if (obj.has("menuBackground") && obj.get("menuBackground").isJsonObject()) {
				AstralBlaze.modules().menuBackground().fromJson(obj.getAsJsonObject("menuBackground"));
			}
		});
		suppress = false;
		dirty = false;
		AstralBlaze.modules().syncFlags();
	}

	public void markDirty() {
		if (suppress) {
			return;
		}
		dirty = true;
		dirtyAt = System.nanoTime();
	}

	public void tickSave() {
		if (!dirty) {
			return;
		}
		if (System.nanoTime() - dirtyAt < TimeUnit.MILLISECONDS.toNanos(750)) {
			return;
		}
		saveNow();
	}

	public void saveNow() {
		dirty = false;
		try {
			Files.createDirectories(root);
			JsonObject modules = new JsonObject();
			for (Module module : AstralBlaze.modules().all()) {
				modules.add(module.name(), module.toJson());
			}
			write(modulesFile, modules);
			write(hudFile, AstralBlaze.hud().toJson());
			write(themesFile, AstralBlaze.themes().toJson());
			JsonObject cfg = new JsonObject();
			cfg.addProperty("reduceMotion", VisualFlags.reduceMotion);
			cfg.addProperty("activeProfile", AstralBlaze.profiles().activeName());
			cfg.add("menuBackground", AstralBlaze.modules().menuBackground().toJson());
			write(configFile, cfg);
		} catch (IOException ignored) {
		}
	}

	private void write(Path path, JsonObject obj) throws IOException {
		Files.writeString(path, GSON.toJson(obj), StandardCharsets.UTF_8);
	}

	private void readJson(Path path, java.util.function.Consumer<JsonObject> consumer) {
		if (!Files.isRegularFile(path)) {
			return;
		}
		try {
			String raw = Files.readString(path, StandardCharsets.UTF_8);
			if (raw.isBlank()) {
				return;
			}
			consumer.accept(JsonParser.parseString(raw).getAsJsonObject());
		} catch (Exception ignored) {
		}
	}
}
