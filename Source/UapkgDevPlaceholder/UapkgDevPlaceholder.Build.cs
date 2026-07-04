// Copyright placeholder. This plugin exists only to exercise UAPKG publishing.

using UnrealBuildTool;

public class UapkgDevPlaceholder : ModuleRules
{
	public UapkgDevPlaceholder(ReadOnlyTargetRules Target) : base(Target)
	{
		PCHUsage = ModuleRules.PCHUsageMode.UseExplicitOrSharedPCHs;

		PublicDependencyModuleNames.AddRange(
			new string[]
			{
				"Core",
			}
		);

		PrivateDependencyModuleNames.AddRange(
			new string[]
			{
				"CoreUObject",
				"Engine",
			}
		);
	}
}
