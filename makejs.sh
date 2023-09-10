#!/bin/bash


# needs:
# sudo npm install -g uglify-js

optimize=0
BASEDIR="/srv/http/cescacs/cescacs.typescript/"
MAKE_SRC=$BASEDIR"dist/src/"
MAKE_DEST=$BASEDIR"dist/"
FILES="cescacs cescacs.types cescacs.positionHelper cescacs.piece cescacs.moves ts.general"

usage() {							# Function: Print a help message.
	echo "Usage: $0 [ -o ] [ -h ]" 1>&2
	echo "-o	optimize"  1>&2
	echo "-h	help (print this message)" 1>&2
	echo "needs"
	echo "sudo npm install -g uglify-js"

}
exit_abnormal() {					# Function: Exit with error.
  usage
  exit 1
}

while getopts ":oh" options; do		# Loop: Get the next option;
									# use silent error checking (full string starts with colon);
 case "${options}" in				# 
    o)
		optimize=1
		;;
	h)
		usage
		exit 0
		;;
	*)								# If unknown (any other) option:
		exit_abnormal				# Exit abnormally.
      ;;
  esac
done

cd $BASEDIR
tsc
if [ $? -ne 0 ] 
then
  exit $?
fi

if [ $optimize -eq 1 ]
then
	for FILE in $FILES
	do
		echo $MAKE_DEST$FILE".js"
		uglifyjs $MAKE_SRC$FILE".js" -c -m -o $MAKE_DEST$FILE".js"
		sed -i 's/\(from[ ]*"[^"]*\)";/\1.js";/g' $MAKE_DEST$FILE".js"
	done
else
	for FILE in $FILES
	do
		echo $MAKE_DEST$FILE".js"
		cp $MAKE_SRC$FILE".js" $MAKE_DEST$FILE".js"
		sed -i 's/\(from[ ]*"[^"]*\)";/\1.js";/g' $MAKE_DEST$FILE".js"
	done
fi
