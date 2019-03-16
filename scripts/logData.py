import time
import sys

def main():
        index = 0
        file = open("ok.txt", "w")
        file.write("ok\n")
        file.close()
        while True:
                print("ok")
                sys.stdout.flush()
                time.sleep(1)
                index+=1
                if(index == 5):
                        sys.exit()

main()