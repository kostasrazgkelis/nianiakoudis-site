namespace NianiakoudisSite;

public static class AssetUrl
{
    // Per-app-load cache buster for static image assets.
    private static readonly string Version = DateTimeOffset.UtcNow.ToUnixTimeMilliseconds().ToString();

    public static string WithVersion(string path) => $"{path}?v={Version}";
}
