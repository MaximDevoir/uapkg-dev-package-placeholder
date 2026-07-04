// Copyright placeholder. This plugin exists only to exercise UAPKG publishing.

#pragma once

#include "CoreMinimal.h"
#include "Modules/ModuleManager.h"

class FUapkgDevPlaceholderModule : public IModuleInterface
{
public:
	/** IModuleInterface implementation */
	virtual void StartupModule() override;
	virtual void ShutdownModule() override;
};
