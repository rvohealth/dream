#!/bin/sh

set -e

if ! git diff-index --quiet HEAD; then
	printf 'These files changed when running the command:\n\n'

	git diff --name-only | while read -r n ; do
		echo "* $n"
	done

	exit 1
fi
