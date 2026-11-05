// Round-robin reviewer assignment (decision D-01, F-02 contract).
//
// reviewerIds: every reviewer in the requester's department, in a stable order.
// lastAssignedId: the reviewer of the department's most recent request, if any.
// Returns the next reviewer after lastAssignedId, wrapping around and skipping
// the requester, or null when nobody is eligible.
export function pickReviewer<Id extends string | number>(
  reviewerIds: readonly Id[],
  requesterId: Id,
  lastAssignedId: Id | null,
): Id | null {
  // indexOf gives -1 for null or a reviewer who left, so the search starts at 0.
  const start = lastAssignedId === null ? 0 : reviewerIds.indexOf(lastAssignedId) + 1;
  for (let offset = 0; offset < reviewerIds.length; offset++) {
    const candidate = reviewerIds[(start + offset) % reviewerIds.length];
    if (candidate !== requesterId) return candidate;
  }
  return null;
}
