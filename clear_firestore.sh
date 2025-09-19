#!/bin/bash

# This script deletes all specified Firestore collections.
# WARNING: This is a destructive action and cannot be undone.

echo "Deleting Firestore collections..."

firebase firestore:delete products --recursive -f
firebase firestore:delete users --recursive -f
firebase firestore:delete chats --recursive -f
firebase firestore:delete notifications --recursive -f
firebase firestore:delete exchanges --recursive -f

echo "All specified Firestore collections have been deleted."
