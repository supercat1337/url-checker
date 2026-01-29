// @ts-check

import fs from 'node:fs';

export class TextFileReader {
    /** @type {string} */
    #path;

    /** @type {{line: number}} */
    #settings;

    /** @type {string} */
    #settingsPath = '';

    /** @type {number} */
    #saveSettingsEveryLine;

    /** @type {boolean} */
    #isOpened = false;

    /** @type {boolean} */
    #isReading = false;

    /** @type {fs.ReadStream} */
    #stream;

    /**
     * Constructor for TextFileReader.
     *
     * @param {number} [saveSettingsEveryLine=10] - The number of lines to read before saving the current line number to a settings file.
     */
    constructor(saveSettingsEveryLine = 10) {
        this.#saveSettingsEveryLine = saveSettingsEveryLine;
    }

    /**
     * Opens a file and sets the internal path if the file exists.
     *
     * @param {string} path - The path to the file to be opened.
     * @throws Will throw an error if the file does not exist.
     */
    openFile(path) {
        if (this.#isOpened) {
            throw new Error('File already opened');
        }

        if (!fs.existsSync(path)) {
            throw new Error('File does not exist');
        }

        this.#path = path;
        this.#settingsPath = this.#path.split('.').slice(0, -1).join('.') + '.settings.json';
        this.#isOpened = true;
    }

    /**
     * Returns the path of the currently opened file.
     *
     * @returns {string} - The path to the currently opened file.
     * @throws Will throw an error if no file is opened.
     */
    getPath() {
        if (!this.#isOpened) {
            throw new Error('File not opened');
        }
        return this.#path;
    }

    /**
     * Reads the file line by line starting from a specified line number and executes a callback function for each line.
     * The reading process can be paused and resumed, and settings are saved periodically.
     *
     * @param {(line:string, lineNumber: number, textFileReader:TextFileReader)=>Promise<void>|void} callback - An asynchronous function to call for each line read,
     * receiving the line content and its corresponding line number.
     * @returns {Promise<boolean>} - A promise that resolves to true when the file reading is completed successfully.
     * @throws Will log an error and reject the promise if an error occurs during file reading.
     */
    async read(callback) {
        if (!this.#isOpened) {
            throw new Error('File not opened');
        }

        if (this.#isReading) {
            throw new Error('Cannot count lines while reading');
        }

        this.#settings = this.#loadSettings();
        const start_line_number = this.#settings.line;
        this.#isReading = true;

        let lineNumber = 0;
        let remaining = '';
        const that = this;

        return new Promise((resolve, reject) => {
            that.#stream = fs.createReadStream(this.#path, {
                encoding: 'utf8',
                highWaterMark: 64 * 1024, // 64KB chunks
            });

            // Flag to prevent concurrent processing
            let isProcessing = false;

            const processData = async chunk => {
                if (isProcessing) return;
                isProcessing = true;

                try {
                    const lines = (remaining + chunk).split(/\r?\n/);
                    remaining = lines.pop(); // Last line may be incomplete

                    for (let i = 0; i < lines.length; i++) {
                        if (lineNumber < start_line_number) {
                            lineNumber++;
                            continue;
                        }

                        // Run the callback for the current line
                        await callback(lines[i], lineNumber + 1, this);

                        lineNumber++;
                        that.#settings.line = lineNumber;

                        // Save settings periodically
                        if (lineNumber % that.#saveSettingsEveryLine === 0) {
                            that.#saveSettings();
                        }
                    }
                } catch (err) {
                    that.#stream.destroy(err);
                    reject(err);
                    return;
                } finally {
                    isProcessing = false;
                }

                // Resume the stream after processing
                that.#stream.resume();
            };

            that.#stream.on('data', chunk => {
                // Pause the stream to process the chunk
                that.#stream.pause();
                processData(chunk);
            });

            that.#stream.on('end', async () => {
                try {
                    // Process any remaining data as the last line
                    if (remaining && lineNumber >= start_line_number) {
                        await callback(remaining, lineNumber + 1, this);
                        lineNumber++;
                        that.#settings.line = lineNumber;
                    }

                    that.#saveSettings();
                    that.#isReading = false;
                    resolve(true);
                } catch (err) {
                    reject(err);
                }
            });

            that.#stream.on('error', err => {
                that.#saveSettings();
                that.#isReading = false;
                console.error('\nError while reading file.', err);
                reject(err);
            });

            that.#stream.on('close', () => {
                that.#isReading = false;
            });
        });
    }

    /**
     * Pauses the file reading process
     */
    pause() {
        if (this.#stream && this.#isReading) {
            this.#stream.pause();
        }
    }

    /**
     * Resumes the file reading process
     */
    resume() {
        if (this.#stream && this.#isReading) {
            this.#stream.resume();
        }
    }

    #loadSettings() {
        let settings = {
            line: 0,
        };

        if (fs.existsSync(this.#settingsPath)) {
            try {
                settings = JSON.parse(fs.readFileSync(this.#settingsPath, 'utf-8'));
            } catch (error) {
                console.warn('Error loading settings, using defaults:', error.message);
            }
        }

        this.#settings = settings;
        return settings;
    }

    #saveSettings() {
        try {
            fs.writeFileSync(this.#settingsPath, JSON.stringify(this.#settings));
        } catch (error) {
            console.warn('Error saving settings:', error.message);
        }
    }

    /**
     * Resets the line number to 0 and saves the settings.
     *
     * This can be useful if you want to start reading from the beginning of the file again.
     */
    resetSettings() {
        if (!this.#isOpened) {
            throw new Error('File not opened');
        }

        if (this.#isReading) {
            throw new Error('Cannot reset settings while reading');
        }

        this.#settings = {
            line: 0,
        };
        this.#saveSettings();
    }

    /**
     * Stops the reading process and ends the current file stream.
     *
     * If the file is not currently being read, the function returns immediately.
     */
    stop() {
        if (!this.#isReading) return;
        if (this.#stream) {
            this.#stream.destroy();
        }
        this.#isReading = false;
    }

    /**
     * Counts the total number of lines in the file.
     *
     * @returns {Promise<number>} - A promise that resolves to the total number of lines in the file.
     */
    async countLines() {
        if (!this.#isOpened) {
            throw new Error('File not opened');
        }

        if (this.#isReading) {
            throw new Error('Cannot count lines while reading');
        }

        this.#isReading = true;

        return new Promise((resolve, reject) => {
            let lineCount = 0;
            let remaining = '';

            const stream = fs.createReadStream(this.#path, {
                encoding: 'utf8',
                highWaterMark: 64 * 1024,
            });

            stream.on('data', chunk => {
                const lines = (remaining + chunk).split(/\r?\n/);
                remaining = lines.pop() || '';
                lineCount += lines.length;
            });

            stream.on('end', () => {
                // Учитываем последнюю строку если она не пустая
                if (remaining) {
                    lineCount++;
                }
                this.#isReading = false;
                resolve(lineCount);
            });

            stream.on('error', err => {
                this.#isReading = false;
                console.error('Error while counting lines:', err);
                reject(err);
            });
        });
    }

    /**
     * Closes the file and cleans up resources.
     */
    close() {
        this.stop();
        this.#isOpened = false;
    }

    /**
     * Gets the current line number from settings.
     *
     * @returns {number} - The current line number
     */
    getCurrentLine() {
        return this.#settings?.line || 0;
    }

    /**
     * Checks if the reader is currently reading.
     *
     * @returns {boolean} - True if reading is in progress
     */
    isReading() {
        return this.#isReading;
    }

    /**
     * Checks if a file is currently opened.
     *
     * @returns {boolean} - True if a file is opened
     */
    isOpened() {
        return this.#isOpened;
    }
}
