/*
Magnetisches Spielfeld Interface für Motor Drivers
*/
//% weight=10 icon="\uf192" color=#ff5733 block="Magnetisches Spielfeld" 
namespace MagneticNavigation {
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
    let levelIndicatorLEDs = neopixel.create(DigitalPin.P2, 64, NeoPixelMode.RGB)


    function resetI2CDevices(){
        let reset_pin = DigitalPin.P1;
        pins.digitalWritePin(reset_pin, 1);
        basic.pause(50);
        pins.digitalWritePin(reset_pin, 0);
        basic.pause(250);
    }

    /**
     * Setze Leistung für alle Elektromagnete auf 0
     */
    //% block="Setze Leistung für alle Elektromagnete auf 0"
    export function zeroAllMagnets() {
        electromagnetDirection = [[0, 0], [0, 0], [0, 0], [0, 0]]
        electromagnetOutput = [[0, 0], [0, 0], [0, 0], [0, 0]]
    }

    /**
     * Setze die Leistung für einen Elektromagneten.
     * Wenn der Index nicht zwischen 1 und 8 liegt wird kein Wert gesetzt und ein Ton ausgegeben.
     * @param index des Elektromagneten
     * @param leistung die der Elektromagnet abgeben soll
     */
    //% block="Setze Leistung für Elektromagnet $index auf $leistung"
    //% leistung.min=-100 leistung.max=100
    //% index.min=1 index.max=8
    //% leistung.defl=0
    //% index.defl=1
    export function setMagnetPower(
        index?: number,
        leistung?: number) {

        if (index >= 1 && index <= 8) {
            let motorDriverIdx = Math.floor((index - 1) / 2)
            let motorDriverPort = (index - 1) % 2

            // set new direction
            if (leistung < 0) {
                electromagnetDirection[motorDriverIdx][motorDriverPort] = 1
            } else {
                electromagnetDirection[motorDriverIdx][motorDriverPort] = 0
            }
            // set new speed
            electromagnetOutput[motorDriverIdx][motorDriverPort] = Math.abs(leistung)
            if (electromagnetOutput[motorDriverIdx][motorDriverPort] > 100) {
                electromagnetOutput[motorDriverIdx][motorDriverPort] = 100
            }
        }
        else {
            music.play(music.tonePlayable(262, music.beat(BeatFraction.Whole)), music.PlaybackMode.UntilDone)
        }
    }

    /**
     * Setze die Leistung für alle Elektromagneten.
     * Wenn die Arraylänge nicht 8 beträgt wird kein Wert gesetzt und ein Ton ausgegeben.
     * @param magnetLevels Array mit 8 Leistungswerten im Bereich [-100;100]
     */
    //% block="Setze die Werte für alle Elektromagnete: $magnetLevels"
    export function setAllMagnetPowers(magnetLevels: number[]): void {
        if (magnetLevels.length == 8) {
            for (let idx = 0; idx < 8; idx++) {
                setMagnetPower(idx + 1, magnetLevels[idx])
            }
        }
        else {
            music.play(music.tonePlayable(262, music.beat(BeatFraction.Whole)), music.PlaybackMode.UntilDone)
        }
    }

    /**
     * Sende alle Leistungswerte zu den Motortreibern und aktiviere die Neopixel.
     * Muss immer ausgeführt werden wenn neu gesetzte Werte angezeigt werden sollen.
     */
    //% block="Sende alle Leistungswerte zum Spielfeld"
    export function writeAll() {
        let directionBuffer = pins.createBuffer(3)
        let speedBuffer = pins.createBuffer(3)
               
        //set led strips
        levelIndicatorLEDs.clear();
        let motorIdx=0;
        let ledStartIdx=0;
        for (let driverIdx = 0; driverIdx < 4; driverIdx++) {
            //set direction buffer
            directionBuffer[0] = DirectionSet
            if (electromagnetDirection[driverIdx][0] == 0 && electromagnetDirection[driverIdx][1] == 0) {
                directionBuffer[1] = BothAntiClockWise
            } else if (electromagnetDirection[driverIdx][0] == 0 && electromagnetDirection[driverIdx][1] == 1) {
                directionBuffer[1] = M1ACWM2CW
            } else if (electromagnetDirection[driverIdx][0] == 1 && electromagnetDirection[driverIdx][1] == 0) {
                directionBuffer[1] = M1CWM2ACW
            } else {
                //both are forward (1)
                directionBuffer[1] = BothClockWise
            }
            directionBuffer[2] = Nothing
            let status;
            status = pins.i2cWriteBuffer(DriverAddress[driverIdx], directionBuffer, false)

            if (status != 0){ resetI2CDevices(); }

            basic.pause(1)

            //set power
            let scaling_pwm = 2.55 * 0.63;
            speedBuffer[0] = MotorSpeedSet
            speedBuffer[1] = Math.floor(electromagnetOutput[driverIdx][0]*scaling_pwm)
            speedBuffer[2] = Math.floor(electromagnetOutput[driverIdx][1]*scaling_pwm)
            status = pins.i2cWriteBuffer(DriverAddress[driverIdx], speedBuffer, false)

            if (status != 0){ resetI2CDevices(); }

            //set all LED lights
            for (let portIdx = 0; portIdx < 2; portIdx++) {
                motorIdx=driverIdx*2+portIdx
                ledStartIdx=motorIdx*8
                let colorChoice = neopixel.rgb(0, 255, 0)
                if (electromagnetDirection[driverIdx][portIdx]>0) {
                    colorChoice = neopixel.rgb(255, 0, 0)
                      }
                if (electromagnetOutput[driverIdx][portIdx] > 10) {
                    levelIndicatorLEDs.setPixelColor(ledStartIdx+3, colorChoice)
                    levelIndicatorLEDs.setPixelColor(ledStartIdx+4, colorChoice)
                }
                if (electromagnetOutput[driverIdx][portIdx] > 40) {
                    levelIndicatorLEDs.setPixelColor(ledStartIdx+2, colorChoice)
                    levelIndicatorLEDs.setPixelColor(ledStartIdx+5, colorChoice)
                }
                if (electromagnetOutput[driverIdx][portIdx] > 70) {
                    levelIndicatorLEDs.setPixelColor(ledStartIdx+1, colorChoice)
                    levelIndicatorLEDs.setPixelColor(ledStartIdx+6, colorChoice)
                }
                if (electromagnetOutput[driverIdx][portIdx] > 95) {
                    levelIndicatorLEDs.setPixelColor(ledStartIdx, colorChoice)
                    levelIndicatorLEDs.setPixelColor(ledStartIdx+7, colorChoice)
                }
            }
            basic.pause(1)
        }

        levelIndicatorLEDs.show()

    }
}
