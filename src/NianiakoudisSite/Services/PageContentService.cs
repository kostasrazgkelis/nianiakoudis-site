using Microsoft.Extensions.Localization;
using NianiakoudisSite.Models;

namespace NianiakoudisSite.Services;

public sealed class PageContentService : IPageContentService
{
    private readonly IStringLocalizer<SharedResource> _localizer;

    public PageContentService(IStringLocalizer<SharedResource> localizer)
    {
        _localizer = localizer;
    }

    public PageContent GetHome()
    {
        return new PageContent(
            _localizer["PageContent.Home.Hero"].Value,
            new[]
            {
                _localizer["PageContent.Home.Highlight1"].Value,
                _localizer["PageContent.Home.Highlight2"].Value,
                _localizer["PageContent.Home.Highlight3"].Value
            },
            _localizer["PageContent.Home.Summary"].Value
        );
    }

    public PageContent GetAbout()
    {
        return new PageContent(
            _localizer["PageContent.About.Hero"].Value,
            new[]
            {
                _localizer["PageContent.About.Highlight1"].Value,
                _localizer["PageContent.About.Highlight2"].Value,
                _localizer["PageContent.About.Highlight3"].Value
            },
            _localizer["PageContent.About.Summary"].Value
        );
    }
}
