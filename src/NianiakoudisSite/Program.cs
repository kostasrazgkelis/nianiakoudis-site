using System.Globalization;
using Blazor.Analytics;
using Microsoft.AspNetCore.Components.Web;
using Microsoft.AspNetCore.Components.WebAssembly.Hosting;
using MudBlazor.Services;
using NianiakoudisSite;
using NianiakoudisSite.Services;

var builder = WebAssemblyHostBuilder.CreateDefault(args);

builder.RootComponents.Add<App>("#app");
builder.RootComponents.Add<HeadOutlet>("head::after");

builder.Services.AddScoped<IPageContentService, PageContentService>();
builder.Services.AddLocalization(options => options.ResourcesPath = "Resources");
builder.Services.AddMudServices();
// production
//builder.Services.AddGoogleAnalytics("G-R36FHVREES");
builder.Services.AddGoogleAnalytics("G-J12Z3G3G6E");

var culture = new CultureInfo("el-GR");
CultureInfo.DefaultThreadCurrentCulture = culture;
CultureInfo.DefaultThreadCurrentUICulture = culture;

await builder.Build().RunAsync();
