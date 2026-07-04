// Copyright placeholder. This plugin exists only to exercise UAPKG publishing.

#include "UapkgDevPlaceholder.h"

#define LOCTEXT_NAMESPACE "FUapkgDevPlaceholderModule"

void FUapkgDevPlaceholderModule::StartupModule()
{
	// Nothing to do — this is a placeholder module for publishing tests.
}

void FUapkgDevPlaceholderModule::ShutdownModule()
{
	// Nothing to do — this is a placeholder module for publishing tests.
}

#undef LOCTEXT_NAMESPACE

IMPLEMENT_MODULE(FUapkgDevPlaceholderModule, UapkgDevPlaceholder)
