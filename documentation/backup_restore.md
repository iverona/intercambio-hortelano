# Firestore Backup & Restore Guide

This guide outlines the process for effectively backing up and restoring your Firestore database.

## 1. Automatic Daily Backups (Recommended)

Google Cloud Firestore supports scheduled backups. To enable this (requires Blaze plan):

1.  Go to the **Google Cloud Console** > **Firestore** > **Backups**.
2.  Create a **Backup Schedule**.
    *   **Frequency**: Daily
    *   **Retention**: 7 days (or as required by policy)
3.  This ensures you have a recovery point in case of catastrophic data loss.

## 2. Manual Backup (CLI)

You can trigger a manual export of your database to a Google Cloud Storage bucket.

**Prerequisites:**
*   `gcloud` CLI installed and authenticated.
*   A Cloud Storage bucket created (e.g., `gs://portal-hortelano-backups`).

**Command:**
```bash
gcloud firestore export gs://portal-hortelano-backups/manual_backup_$(date +%Y%m%d)
```

## 3. Restoring Data

**Warning**: Restoring data can verify complex. Usually, you import into a *new* project to verify data before touching production, or import specific collections.

**Command:**
```bash
gcloud firestore import gs://portal-hortelano-backups/manual_backup_YYYYMMDD
```

### Partial Restore (Development/Recovery)
To restore only specific collections (e.g., recovering accidentally deleted users):

```bash
gcloud firestore import gs://portal-hortelano-backups/manual_backup_YYYYMMDD --collection-ids='users'
```

## 4. Disaster Recovery Plan

In the event of a critical failure:
1.  **Stop Writes**: Update Security Rules to deny all writes to prevent data inconsistency during recovery.
2.  **Verify Backup**: List available backups in Cloud Console.
3.  **Restore**: using the `import` command above.
4.  **Verify Data**: Check critical paths (login, product listing).
5.  **Resume**: Revert Security Rules to allow traffic.
