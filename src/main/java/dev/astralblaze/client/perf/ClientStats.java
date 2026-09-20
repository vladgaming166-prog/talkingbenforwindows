package dev.astralblaze.client.perf;

import net.minecraft.client.Minecraft;
import net.minecraft.client.multiplayer.ClientPacketListener;
import net.minecraft.client.multiplayer.PlayerInfo;
import net.minecraft.client.multiplayer.ServerData;
import net.minecraft.client.player.LocalPlayer;
import net.minecraft.core.BlockPos;
import net.minecraft.core.Holder;
import net.minecraft.resources.ResourceKey;
import net.minecraft.util.Mth;
import net.minecraft.world.level.biome.Biome;
import net.minecraft.world.phys.Vec3;

/**
 * Event-driven client statistics. Expensive strings and ping are refreshed on a timer, not every frame.
 */
public final class ClientStats {
	private static final int PING_INTERVAL_MS = 1000;
	private static final int POS_INTERVAL_MS = 80;
	private static final int FRAME_SAMPLES = 180;

	private static long sessionStartMs;
	private static long lastPingAt;
	private static long lastPosAt;
	private static int ping;
	private static int fps;
	private static int minFps = 1000;
	private static int maxFps;
	private static float avgFps;
	private static double x, y, z;
	private static int ix, iy, iz;
	private static String coords = "0 0 0";
	private static String biome = "—";
	private static String dimension = "Overworld";
	private static String facing = "S";
	private static String facingFull = "South";
	private static String server = "Singleplayer";
	private static double speedBps;
	private static String speedText = "0.00 BPS";
	private static final long[] frameTimes = new long[FRAME_SAMPLES];
	private static int frameIndex;
	private static int frameCount;
	private static long lastFrameNs;
	private static String fpsText = "0 FPS";
	private static String pingText = "0 ms";
	private static String ramText = "0 / 0 MB";
	private static long lastRamAt;
	private static long usedMem;
	private static long maxMem;

	private ClientStats() {
	}

	public static void startSession() {
		sessionStartMs = System.currentTimeMillis();
	}

	public static void onFrame() {
		long now = System.nanoTime();
		if (lastFrameNs != 0) {
			long dt = now - lastFrameNs;
			if (dt > 0 && dt < 1_000_000_000L) {
				frameTimes[frameIndex] = dt;
				frameIndex = (frameIndex + 1) % FRAME_SAMPLES;
				if (frameCount < FRAME_SAMPLES) {
					frameCount++;
				}
			}
		}
		lastFrameNs = now;

		Minecraft mc = Minecraft.getInstance();
		fps = mc.getFps();
		if (frameCount > 8) {
			long min = Long.MAX_VALUE;
			long max = 0;
			long acc = 0;
			for (int i = 0; i < frameCount; i++) {
				long t = frameTimes[i];
				if (t < min) min = t;
				if (t > max) max = t;
				acc += t;
			}
			minFps = (int) Math.max(1, 1_000_000_000L / Math.max(1, max));
			maxFps = (int) Math.max(1, 1_000_000_000L / Math.max(1, min));
			avgFps = 1_000_000_000F / (acc / (float) frameCount);
		} else {
			minFps = fps;
			maxFps = fps;
			avgFps = fps;
		}
		fpsText = fps + " FPS";

		long ms = System.currentTimeMillis();
		if (ms - lastRamAt > 400) {
			lastRamAt = ms;
			Runtime rt = Runtime.getRuntime();
			maxMem = rt.maxMemory();
			usedMem = rt.totalMemory() - rt.freeMemory();
			ramText = (usedMem / 1024 / 1024) + " / " + (maxMem / 1024 / 1024) + " MB";
		}
	}

	public static void onTick(Minecraft mc) {
		long now = System.currentTimeMillis();
		if (now - lastPingAt >= PING_INTERVAL_MS) {
			lastPingAt = now;
			refreshPing(mc);
		}
		if (now - lastPosAt >= POS_INTERVAL_MS) {
			lastPosAt = now;
			refreshWorld(mc);
		}
		refreshServer(mc);
	}

	private static void refreshPing(Minecraft mc) {
		ClientPacketListener connection = mc.getConnection();
		LocalPlayer player = mc.player;
		if (connection == null || player == null) {
			ping = 0;
			pingText = "0 ms";
			return;
		}
		PlayerInfo info = connection.getPlayerInfo(player.getUUID());
		if (info == null) {
			ping = mc.getSingleplayerServer() != null ? 0 : ping;
		} else {
			ping = info.getLatency();
		}
		pingText = ping + " ms";
	}

	private static void refreshWorld(Minecraft mc) {
		LocalPlayer player = mc.player;
		if (player == null || mc.level == null) {
			return;
		}
		Vec3 pos = player.position();
		x = pos.x;
		y = pos.y;
		z = pos.z;
		int nx = Mth.floor(x);
		int ny = Mth.floor(y);
		int nz = Mth.floor(z);
		if (nx != ix || ny != iy || nz != iz) {
			ix = nx;
			iy = ny;
			iz = nz;
			coords = ix + " " + iy + " " + iz;
			Holder<Biome> holder = mc.level.getBiome(new BlockPos(ix, iy, iz));
			biome = holder.unwrapKey().map(ClientStats::biomeName).orElse("Unknown");
			dimension = mc.level.dimension().identifier().getPath().replace('_', ' ');
			if (!dimension.isEmpty()) {
				dimension = Character.toUpperCase(dimension.charAt(0)) + dimension.substring(1);
			}
		}
		float yaw = player.getYRot();
		int dir8 = Mth.floor((yaw + 180.0F + 22.5F) / 45.0F) & 7;
		facing = switch (dir8) {
			case 0 -> "S";
			case 1 -> "SW";
			case 2 -> "W";
			case 3 -> "NW";
			case 4 -> "N";
			case 5 -> "NE";
			case 6 -> "E";
			default -> "SE";
		};
		facingFull = switch (dir8) {
			case 0 -> "South";
			case 1 -> "Southwest";
			case 2 -> "West";
			case 3 -> "Northwest";
			case 4 -> "North";
			case 5 -> "Northeast";
			case 6 -> "East";
			default -> "Southeast";
		};
		Vec3 vel = player.getDeltaMovement();
		speedBps = Math.hypot(vel.x, vel.z) * 20.0;
		speedText = String.format("%.2f BPS", speedBps);
	}

	private static void refreshServer(Minecraft mc) {
		if (mc.getSingleplayerServer() != null) {
			server = "Singleplayer";
			return;
		}
		ServerData data = mc.getCurrentServer();
		if (data == null) {
			server = mc.level == null ? "Main Menu" : "Multiplayer";
			return;
		}
		String name = data.name;
		if (name == null || name.isBlank()) {
			name = data.ip;
		}
		server = name == null || name.isBlank() ? "Multiplayer" : name;
	}

	private static String biomeName(ResourceKey<Biome> key) {
		String path = key.identifier().getPath().replace('_', ' ');
		if (path.isEmpty()) {
			return "Unknown";
		}
		return Character.toUpperCase(path.charAt(0)) + path.substring(1);
	}

	public static int fps() { return fps; }
	public static int minFps() { return minFps; }
	public static int maxFps() { return maxFps; }
	public static float avgFps() { return avgFps; }
	public static int ping() { return ping; }
	public static String fpsText() { return fpsText; }
	public static String pingText() { return pingText; }
	public static String ramText() { return ramText; }
	public static String coords() { return coords; }
	public static String biome() { return biome; }
	public static String dimension() { return dimension; }
	public static String facing() { return facing; }
	public static String facingFull() { return facingFull; }
	public static String server() { return server; }
	public static String speedText() { return speedText; }
	public static double x() { return x; }
	public static double y() { return y; }
	public static double z() { return z; }
	public static long usedMem() { return usedMem; }
	public static long maxMem() { return maxMem; }
	public static double frameMs() { return fps <= 0 ? 0 : 1000.0 / fps; }

	public static String sessionText() {
		long s = Math.max(0, (System.currentTimeMillis() - sessionStartMs) / 1000);
		long h = s / 3600;
		long m = (s % 3600) / 60;
		long sec = s % 60;
		if (h > 0) {
			return h + "h " + m + "m";
		}
		return m + "m " + sec + "s";
	}

	public static int entityCount(Minecraft mc) {
		if (mc.level == null) {
			return 0;
		}
		return mc.level.getEntityCount();
	}
}
