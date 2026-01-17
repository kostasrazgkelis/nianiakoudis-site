using System.Collections.Generic;

namespace NianiakoudisSite.Models;

public sealed record HomeFlowItem(
    string Title,
    IReadOnlyList<string> BodyLines,
    int GridColumn,
    int GridRow,
    int FlowIndex);
