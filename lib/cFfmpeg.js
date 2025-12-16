import ffmpeg from "fluent-ffmpeg"
import fs from "fs"

export function toAudio(input, output = "./temp_audio.mp3") {
  return new Promise((resolve, reject) => {
    ffmpeg(input)
      .output(output)
      .on("end", () => resolve(output))
      .on("error", reject)
      .run()
  })
}

export function toPTT(input, output = "./ptt.opus") {
  return new Promise((resolve, reject) => {
    ffmpeg(input)
      .audioCodec("libopus")
      .audioBitrate("64k")
      .output(output)
      .on("end", () => resolve(output))
      .on("error", reject)
      .run()
  })
}

export function toVideo(input, output = "./temp_video.mp4") {
  return new Promise((resolve, reject) => {
    ffmpeg(input)
      .output(output)
      .on("end", () => resolve(output))
      .on("error", reject)
      .run()
  })
}

export function convertAudio(input, output = "./audio.mp3") {
  return new Promise((resolve, reject) => {
    ffmpeg(input)
      .output(output)
      .on("end", () => resolve(output))
      .on("error", reject)
      .run()
  })
}

export function convertVideo(input, output = "./video.mp4") {
  return new Promise((resolve, reject) => {
    ffmpeg(input)
      .output(output)
      .on("end", () => resolve(output))
      .on("error", reject)
      .run()
  })
}
