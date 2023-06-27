/*
Magnetisches Spielfeld Interface für Motor Drivers
*/
//% weight=10 icon="\uf192" color=#ff5733 block="Magnetisches Spielfeld" 
namespace MagnetischeNavigation {
    let MotorSpeedSet = 0x82
    let PWMFrequenceSet = 0x84
    let DirectionSet = 0xaa
    let MotorSetA = 0xa1
    let MotorSetB = 0xa5
    let Nothing = 0x01
    let EnableStepper = 0x1a
    let UnenableStepper = 0x1b
    let Stepernu = 0x1c
    let BothClockWise = 0x0a
    let BothAntiClockWise = 0x05
    let M1CWM2ACW = 0x06
    let M1ACWM2CW = 0x09
    let I2CMotorDriverAdd = 0x0d
    let electromagnetDirection = [[0, 0], [0, 0], [0, 0], [0, 0]]
    let electromagnetOutput = [[0, 0], [0, 0], [0, 0], [0, 0]]
    let DriverAddress = [0x0A, 0x0B, 0x0C, 0x0D]
    let strip = neopixel.create(DigitalPin.P2, 64, NeoPixelMode.RGB)


    /**
     * Setze die Leistung für einen Elektromagneten
     * @param index des Elektromagneten
     * @param leistung die der Elektromagnet abgeben soll
     */
    //% block="Setze Leistung für Elektromagnet $index auf $leistung"
    //% leistung.min=-255 leistung.max=255
    //% index.min=1 index.max=8
    //% leistung.defl=0
    //% index.defl=1
    export function setMotorSpeed(
        index?: number,
        leistung?: number) {
        let motorDriverIdx = Math.floor((index - 1) / 2)
        let motorDriverPort = (index - 1) % 2
        let directionBuffer = pins.createBuffer(3)
        let speedBuffer = pins.createBuffer(3)

        // set new direction
        if (leistung < 0) {
            electromagnetDirection[motorDriverIdx][motorDriverPort] = 1
        } else {
            electromagnetDirection[motorDriverIdx][motorDriverPort] = 0
        }
        // set new speed
        electromagnetOutput[motorDriverIdx][motorDriverPort] = Math.abs(leistung)
        if (electromagnetOutput[motorDriverIdx][motorDriverPort] > 255) {
            electromagnetOutput[motorDriverIdx][motorDriverPort] = 255
        }

        //set direction buffer
        directionBuffer[0] = DirectionSet
        if (electromagnetDirection[motorDriverIdx][0] == 0 && electromagnetDirection[motorDriverIdx][1] == 0) {
            directionBuffer[1] = BothAntiClockWise
        } else if (electromagnetDirection[motorDriverIdx][0] == 0 && electromagnetDirection[motorDriverIdx][1] == 1) {
            directionBuffer[1] = M1ACWM2CW
        } else if (electromagnetDirection[motorDriverIdx][0] == 1 && electromagnetDirection[motorDriverIdx][1] == 0) {
            directionBuffer[1] = M1CWM2ACW
        } else {
            //both are forward (1)
            directionBuffer[1] = BothClockWise
        }
        directionBuffer[2] = Nothing
        pins.i2cWriteBuffer(DriverAddress[motorDriverIdx], directionBuffer, false)

        //set power
        speedBuffer[0] = MotorSpeedSet
        speedBuffer[1] = electromagnetOutput[motorDriverIdx][0]
        speedBuffer[2] = electromagnetOutput[motorDriverIdx][1]
        pins.i2cWriteBuffer(DriverAddress[motorDriverIdx], speedBuffer, false)
        
//set led strips
        strip.clear();
        let motorIdx=0;
        let ledStartIdx=0;
        for (let driverIdx = 0; driverIdx < 4; driverIdx++) {
    	    for (let portIdx = 0; portIdx < 2; portIdx++) {
                motorIdx=driverIdx*2+portIdx
                ledStartIdx=motorIdx*8
                let colorChoice = neopixel.rgb(0, 255, 0)
                if (electromagnetDirection[driverIdx][portIdx]>0) {
                    colorChoice = neopixel.rgb(255, 0, 0)
                      }
                if (electromagnetOutput[driverIdx][portIdx] > 35) {
                    strip.setPixelColor(ledStartIdx+3, colorChoice)
                    strip.setPixelColor(ledStartIdx+4, colorChoice)
                }
                if (electromagnetOutput[driverIdx][portIdx] > 110) {
                    strip.setPixelColor(ledStartIdx+2, colorChoice)
                    strip.setPixelColor(ledStartIdx+5, colorChoice)
                }
                if (electromagnetOutput[driverIdx][portIdx] > 160) {
                    strip.setPixelColor(ledStartIdx+1, colorChoice)
                    strip.setPixelColor(ledStartIdx+6, colorChoice)
                }
                if (electromagnetOutput[driverIdx][portIdx] > 220) {
                    strip.setPixelColor(ledStartIdx, colorChoice)
                    strip.setPixelColor(ledStartIdx+7, colorChoice)
                }
            }
        }

        strip.show()

    }

}
