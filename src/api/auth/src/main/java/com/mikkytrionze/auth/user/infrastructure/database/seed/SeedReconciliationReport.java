package com.mikkytrionze.auth.user.infrastructure.database.seed;

import java.util.ArrayList;
import java.util.List;

public record SeedReconciliationReport(List<String> created, List<String> updated, List<String> unchanged, List<String> warnings) {
    public static SeedReconciliationReport empty() { return new SeedReconciliationReport(new ArrayList<>(), new ArrayList<>(), new ArrayList<>(), new ArrayList<>()); }
    public void addCreated(String v){created.add(v);} public void addUpdated(String v){updated.add(v);} public void addUnchanged(String v){unchanged.add(v);} public void addWarning(String v){warnings.add(v);}
}
