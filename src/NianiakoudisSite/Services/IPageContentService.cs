using NianiakoudisSite.Models;

namespace NianiakoudisSite.Services;

public interface IPageContentService
{
    PageContent GetHome();
    PageContent GetAbout();
}
