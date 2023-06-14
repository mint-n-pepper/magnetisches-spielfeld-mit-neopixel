

//% color="170"
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
    let strip = neopixel.create(DigitalPin.P0, 32, NeoPixelMode.RGB)


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
        
        strip.showRainbow(1, 360)
        strip.show()

    }

}
