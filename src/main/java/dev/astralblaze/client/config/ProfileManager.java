package dev.astralblaze.client.config;

import com.google.gson.Gson;
import com.google.gson.GsonBuilder;
import com.google.gson.JsonObject;
import com.google.gson.JsonParser;
import dev.astralblaze.client.AstralBlaze;
import net.fabricmc.loader.api.FabricLoader;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import java.util.stream.Collectors;
import java.util.stream.Stream;

public final class ProfileManager {
	private static final Gson GSON = new GsonBuilder().setPrettyPrinting().disableHtmlEscaping().create();
	private String active = "Default";

	public Path dir() {
		return FabricLoader.getInstance().getConfigDir().resolve("astralblaze").resolve("profiles");
	}

	public void registerDefaults() {
		try {
			Files.createDirectories(dir());
			ensure("Default");
			ensure("PvP");
			ensure("Recording");
			ensure("Low FPS");
			ensure("Custom");
		} catch (IOException ignored) {
		}
	}

	public String activeName() {
		return active;
	}

	public void setActiveName(String name) {
		if (name != null && !name.isBlank()) {
			active = name;
		}
	}

	public List<String> names() {
		try (Stream<Path> stream = Files.list(dir())) {
			List<String> list = stream
				.filter(p -> p.getFileName().toString().endsWith(".json"))
				.map(p -> p.getFileName().toString().replace(".json", ""))
				.sorted()
				.collect(Collectors.toCollection(ArrayList::new));
			if (list.isEmpty()) {
				list.add("Default");
			}
			return list;
		} catch (IOException e) {
			return List.of("Default");
		}
	}

	public void save(String name) {
		try {
			Files.createDirectories(dir());
			JsonObject snap = snapshot();
			Files.writeString(file(name), GSON.toJson(snap), StandardCharsets.UTF_8);
			active = name;
			AstralBlaze.toasts().push("Profile", "Saved " + name);
			AstralBlaze.config().markDirty();
		} catch (IOException ignored) {
		}
	}

	public void load(String name) {
		Path path = file(name);
		if (!Files.isRegularFile(path)) {
			return;
		}
		try {
			JsonObject json = JsonParser.parseString(Files.readString(path, StandardCharsets.UTF_8)).getAsJsonObject();
			apply(json);
			active = name;
			AstralBlaze.modules().syncFlags();
			AstralBlaze.toasts().push("Profile", "Loaded " + name);
			AstralBlaze.config().markDirty();
		} catch (Exception ignored) {
		}
	}

	public void delete(String name) {
		if ("Default".equals(name)) {
			return;
		}
		try {
			Files.deleteIfExists(file(name));
			if (active.equals(name)) {
				active = "Default";
			}
			AstralBlaze.toasts().push("Profile", "Deleted " + name);
		} catch (IOException ignored) {
		}
	}

	public void rename(String from, String to) {
		if (to == null || to.isBlank()) {
			return;
		}
		Path src = file(from);
		Path dst = file(to);
		try {
			if (Files.exists(src) && !Files.exists(dst)) {
				Files.move(src, dst);
				if (active.equals(from)) {
					active = to;
				}
				AstralBlaze.toasts().push("Profile", "Renamed to " + to);
			}
		} catch (IOException ignored) {
		}
	}

	public void duplicate(String from, String to) {
		try {
			Path src = file(from);
			if (Files.isRegularFile(src)) {
				Files.copy(src, file(to));
				AstralBlaze.toasts().push("Profile", "Duplicated " + to);
			}
		} catch (IOException ignored) {
		}
	}

	public Path exportTo(String name) {
		save(name);
		return file(name);
	}

	public void importFrom(Path path) {
		if (path == null || !Files.isRegularFile(path)) {
			return;
		}
		String name = path.getFileName().toString().replace(".json", "");
		try {
			Files.copy(path, file(name));
			load(name);
			AstralBlaze.toasts().push("Profile", "Imported " + name);
		} catch (IOException ignored) {
		}
	}

	private void ensure(String name) throws IOException {
		Path path = file(name);
		if (!Files.exists(path)) {
			Files.writeString(path, GSON.toJson(snapshot()), StandardCharsets.UTF_8);
		}
	}

	private Path file(String name) {
		String safe = name.trim().replaceAll("[^a-zA-Z0-9 _.-]", "_");
		return dir().resolve(safe + ".json");
	}

	private JsonObject snapshot() {
		JsonObject json = new JsonObject();
		JsonObject modules = new JsonObject();
		AstralBlaze.modules().all().forEach(m -> modules.add(m.name(), m.toJson()));
		json.add("modules", modules);
		json.add("hud", AstralBlaze.hud().toJson());
		json.add("theme", AstralBlaze.themes().current().toJson());
		return json;
	}

	private void apply(JsonObject json) {
		if (json.has("modules") && json.get("modules").isJsonObject()) {
			JsonObject modules = json.getAsJsonObject("modules");
			AstralBlaze.modules().all().forEach(m -> {
				if (modules.has(m.name()) && modules.get(m.name()).isJsonObject()) {
					m.fromJson(modules.getAsJsonObject(m.name()));
				}
			});
		}
		if (json.has("hud") && json.get("hud").isJsonObject()) {
			AstralBlaze.hud().fromJson(json.getAsJsonObject("hud"));
		}
		if (json.has("theme") && json.get("theme").isJsonObject()) {
			AstralBlaze.themes().current().fromJson(json.getAsJsonObject("theme"));
		}
	}

	public static String nextCopyName(String base) {
		return base + " copy";
	}

	public static String sanitize(String name) {
		return name == null ? "Custom" : name.trim().toLowerCase(Locale.ROOT);
	}
}
