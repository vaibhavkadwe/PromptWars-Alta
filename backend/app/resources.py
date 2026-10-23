"""Static verified resource catalog and deterministic selection rules."""

from backend.app.schemas import (
    CategoryId,
    IncidentDetails,
    IncidentReport,
    Resource,
    ResourceId,
    SafetyFlags,
)

STATIC_RESOURCE_CATALOG: dict[ResourceId, Resource] = {
    ResourceId.NCRP: Resource(
        id=ResourceId.NCRP,
        title="National Cyber Crime Reporting Portal",
        kind="link",
        value="https://cybercrime.gov.in/",
        purpose="Government of India portal to report cybercrime online, with a special focus on crimes against women and children.",
        when="Almost always relevant for reporting digital blackmail, extortion, and cyber harassment.",
        limitations="No guaranteed outcome or timeline; check what the portal asks for before you begin.",
        last_checked="2026-10-23",
    ),
    ResourceId.HELPLINE_1930: Resource(
        id=ResourceId.HELPLINE_1930,
        title="National Cyber Crime Helpline",
        kind="phone",
        value="1930",
        purpose="Phone line linked to the National Cyber Crime Reporting Portal, reported as available 24 hours.",
        when="Money was already sent, a UPI/payment demand is involved, or you prefer to call for immediate guidance.",
        limitations="Mainly used for financial cyber fraud.",
        last_checked="2026-10-23",
    ),
    ResourceId.ERSS_112: Resource(
        id=ResourceId.ERSS_112,
        title="Emergency Response (police, fire, ambulance)",
        kind="phone",
        value="112",
        purpose="All-in-one emergency service number for physical threats, urgent police assistance, or immediate crisis.",
        when="Immediate danger to you or anyone, threats to your physical location, or crisis.",
        limitations="Emergencies only.",
        last_checked="2026-10-23",
    ),
    ResourceId.CHILDLINE_1098: Resource(
        id=ResourceId.CHILDLINE_1098,
        title="Childline (child helpline)",
        kind="phone",
        value="1098",
        purpose="Emergency, day-and-night outreach service for children in need of care and protection.",
        when="You may be under 18 or the incident involves a minor.",
        limitations="The service is being integrated with 112; the number is reported to remain active.",
        last_checked="2026-10-23",
    ),
    ResourceId.WOMEN_181: Resource(
        id=ResourceId.WOMEN_181,
        title="Women Helpline",
        kind="phone",
        value="181",
        purpose="24/7 confidential helpline for women affected by violence and harassment.",
        when="You are a woman or girl and want to talk to someone for support or guidance.",
        limitations="Scope for online image abuse not confirmed; optional.",
        last_checked="2026-10-23",
    ),
    ResourceId.STOPNCII: Resource(
        id=ResourceId.STOPNCII,
        title="StopNCII.org",
        kind="link",
        value="https://stopncii.org/",
        purpose="Helps adults stop intimate images from being shared on participating platforms; images stay on your device and only a hash is shared.",
        when="You are 18+ (or the images were taken when you were 18+) and intimate images exist or are threatened.",
        limitations="Participating platforms only; keep your case number and PIN; do this on their site, never in SafeSignal.",
        last_checked="2026-10-23",
    ),
    ResourceId.TAKE_IT_DOWN: Resource(
        id=ResourceId.TAKE_IT_DOWN,
        title="Take It Down (NCMEC)",
        kind="link",
        value="https://takeitdown.ncmec.org/",
        purpose="Free service for images or videos taken when you were under 18; only a hash is shared.",
        when="Images or videos were taken when you were under 18 years old.",
        limitations="Participating, public or unencrypted platforms only.",
        last_checked="2026-10-23",
    ),
    ResourceId.META_NCII: Resource(
        id=ResourceId.META_NCII,
        title="Meta: reporting threats and intimate images",
        kind="link",
        value="https://www.meta.com/safety/topics/bullying-harassment/ncii/",
        purpose="Meta's official guidance and reporting process for intimate image abuse on Instagram, Facebook, and Messenger.",
        when="The platform is Instagram, Facebook, or Messenger.",
        limitations="Covers Meta apps only.",
        last_checked="2026-10-23",
    ),
}


def get_all_resources() -> list[Resource]:
    """Return all verified catalog resources."""
    return list(STATIC_RESOURCE_CATALOG.values())


def select_resources(
    details: IncidentDetails,
    safety: SafetyFlags,
    report: IncidentReport,
) -> list[Resource]:
    """
    Select and order verified resources based on deterministic rules and allowlisted model suggestions.
    Order:
      1. emergency (ERSS_112)
      2. child (CHILDLINE_1098, TAKE_IT_DOWN)
      3. NCRP (always)
      4. helpline (HELPLINE_1930)
      5. image-removal tools (STOPNCII or TAKE_IT_DOWN)
      6. platform-specific (META_NCII)
      7. optional other allowlisted resources (e.g. WOMEN_181)
    """
    suggested_ids: set[ResourceId] = set()

    # Collect valid model-suggested resource IDs from actions
    for action in report.actions:
        for res_id in action.resource_ids:
            if res_id in STATIC_RESOURCE_CATALOG:
                suggested_ids.add(res_id)

    # 1. Emergency
    is_emergency = safety.physical_danger or safety.self_harm or report.risk.level == "urgent"

    # 2. Minor status
    is_minor = safety.possible_minor or report.risk.possible_minor or details.may_be_under_18 is True

    # 3. Money / financial demand
    has_money_demand = (
        details.money_demanded is True
        or any(cat.id == CategoryId.MONEY_DEMAND for cat in report.categories)
        or any(d.kind.value == "money_demand" for d in report.extracted_details)
    )

    # 4. Image threats
    image_threat_cats = {
        CategoryId.THREAT_TO_SHARE_IMAGES,
        CategoryId.COERCION_FOR_MORE_CONTENT,
        CategoryId.SUSPECTED_NON_CONSENSUAL_RECORDING,
        CategoryId.SUSPECTED_AI_GENERATED_IMAGERY,
    }
    has_image_threat = any(cat.id in image_threat_cats for cat in report.categories) or details.threat_types and any(t in image_threat_cats for t in details.threat_types)

    # 5. Meta platform detection
    meta_keywords = ("instagram", "facebook", "messenger", "meta", "insta", "ig", "fb")
    platform_text = (details.platform or "").lower()
    extracted_platforms = [
        d.value.lower() for d in report.extracted_details if d.kind.value == "platform"
    ]
    is_meta = any(k in platform_text for k in meta_keywords) or any(
        any(k in ep for k in meta_keywords) for ep in extracted_platforms
    )

    selected: list[ResourceId] = []

    # Priority 1: Emergency 112
    if is_emergency or ResourceId.ERSS_112 in suggested_ids:
        if ResourceId.ERSS_112 not in selected:
            selected.append(ResourceId.ERSS_112)

    # Priority 2: Childline 1098 & Take It Down (if minor)
    if is_minor:
        if ResourceId.CHILDLINE_1098 not in selected:
            selected.append(ResourceId.CHILDLINE_1098)
        if ResourceId.TAKE_IT_DOWN not in selected:
            selected.append(ResourceId.TAKE_IT_DOWN)

    # Priority 3: NCRP (always)
    if ResourceId.NCRP not in selected:
        selected.append(ResourceId.NCRP)

    # Priority 4: Helpline 1930 (if money demanded)
    if has_money_demand or ResourceId.HELPLINE_1930 in suggested_ids:
        if ResourceId.HELPLINE_1930 not in selected:
            selected.append(ResourceId.HELPLINE_1930)

    # Priority 5: Image-removal tools (STOPNCII for adult, TAKE_IT_DOWN for minor)
    if is_minor:
        # StopNCII is strictly excluded for minors
        pass
    else:
        if (has_image_threat or ResourceId.STOPNCII in suggested_ids) and ResourceId.STOPNCII not in selected:
            selected.append(ResourceId.STOPNCII)

    # Priority 6: Platform-specific (Meta NCII)
    if (is_meta or ResourceId.META_NCII in suggested_ids) and ResourceId.META_NCII not in selected:
        selected.append(ResourceId.META_NCII)

    # Priority 7: Women 181 if suggested by model
    if ResourceId.WOMEN_181 in suggested_ids and ResourceId.WOMEN_181 not in selected:
        selected.append(ResourceId.WOMEN_181)

    return [STATIC_RESOURCE_CATALOG[rid] for rid in selected if rid in STATIC_RESOURCE_CATALOG]
