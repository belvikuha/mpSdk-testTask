"use client";
import {useEffect, useRef, useState} from "react";

import {MpSdk} from "@matterport/sdk";

import * as THREE from "three";
import {GLTFLoader} from "three/examples/jsm/loaders/GLTFLoader";

import Menu, {IMenuOption} from "./components/menu/menu";

export default function MatterportPage() {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [mpSdk, setMpSdk] = useState<MpSdk>();
  const [currentUserSweep, setCurrentUserSweep] = useState();

  const onLoad = async () => {
    if (!iframeRef.current) return;
    let mpSdk;
    const showcaseWindow = iframeRef?.current?.contentWindow;
    try {
      mpSdk = await showcaseWindow?.MP_SDK.connect(showcaseWindow);
      // addModelToScene(mpSdk, "665pcnn0eaxz2x80xb473gg3b");

      mpSdk.App.state.subscribe(async appState => {
        if (appState.phase === "appphase.playing") {
          setMpSdk(mpSdk);
          console.log("Сцена загружена! Теперь можно запрашивать данные.");

          const allObjects = await mpSdk.Scene.query(["model"]);
          console.log("Все объекты сцены:", allObjects[0].parent);
        }
      });
    } catch (e) {
      console.error(e);
      return;
    }
    console.log("Hello Bundle SDK", mpSdk);
  };

  useEffect(() => {
    onLoad();
  }, []);

  useEffect(() => {
    if (!mpSdk) return;

    const addTag = async () => {
      try {
        const tag = await mpSdk.Tag.add({
          label: "Office",
          anchorPosition: {x: 8.864036560058594, y: 1.582658052444458, z: -17.281137466430664},
          stemVector: {x: 0, y: 0.3, z: 0}, // Стебель тега
          color: {r: 1.0, g: 0.0, b: 0.0},
        });
        console.log("Тег добавлен:", tag);
      } catch (err) {
        console.error("Ошибка при добавлении тега", err);
      }
    };
    const trackUserSweep = async () => {
      try {
        mpSdk.Sweep.current.subscribe(function (currentSweep) {
          // Change to the current sweep has occurred.
          if (currentSweep.sid === "") {
            console.log("Not currently stationed at a sweep position");
          } else {
            setCurrentUserSweep(currentSweep.sid);
            console.log(" currently stationed at sweep " + currentSweep.sid);
          }
        });
      } catch (err) {
        console.error("Ошибка при отслеживании Sweep", err);
      }
    };

    addTag();
    // addModelToSweep("665pcnn0eaxz2x80xb473gg3b");
    trackUserSweep();
  }, [mpSdk]);

  function angleBetweenVectors(point1, point2) {
    // Вычисляем вектор
    let vector1 = {x: point1.x2 - point1.x1, y: point1.y2 - point1.y1};
    let vector2 = {x: point2.x2 - point2.x1, y: point2.y2 - point2.y1};

    // Скалярное произведение
    let dotProduct = vector1.x * vector2.x + vector1.y * vector2.y;

    // Длины векторов
    let magnitude1 = Math.sqrt(vector1.x ** 2 + vector1.y ** 2);
    let magnitude2 = Math.sqrt(vector2.x ** 2 + vector2.y ** 2);

    // Вычисляем косинус угла
    let cosTheta = dotProduct / (magnitude1 * magnitude2);

    // Преобразуем в градусы
    let angle = Math.acos(Math.min(Math.max(cosTheta, -1), 1)) * (180 / Math.PI);

    return angle;
  }

  const addTag = async anchorPosition => {
    try {
      await mpSdk.Tag.add({
        anchorPosition: {x: anchorPosition.x, y: 0.1, z: anchorPosition.z},
        stemVector: {x: 0, y: 0, z: 0},
        color: {r: 0.0, g: 0.0, b: 1.0},
      });
    } catch (err) {
      console.error("Ошибка при добавлении тега", err);
    }
  };

  async function moveByPath(path) {
    const modelData = await mpSdk.Model.getData();
    for (let i = 0; i < path.length; i++) {
      const vertex = path[i];
      const sweepId = vertex.id;

      try {
        const sweep = modelData.sweeps.find(sw => sw.sid === sweepId);

        if (!sweep) {
          throw new Error(`Sweep c ID ${sweepId} не найден!`);
        }
        const {x: x2, y: y2} = sweep.position;

        await mpSdk.Sweep.moveTo(sweepId, {
          transition: mpSdk.Sweep.Transition.FLY,
          transitionTime: 2000,
        });

        /// поворот камеры
        if (i !== 0 && i !== path.length - 1) {
          const prevSweep = modelData.sweeps.find(sw => sw.sid === path?.[i - 1]?.id);
          const futureSweep = modelData.sweeps.find(sw => sw.sid === path?.[i + 1]?.id);

          if (!sweep || !prevSweep) {
            throw new Error(`Sweep c ID ${sweepId} не найден!`);
          }

          const {x: x1, y: y1} = prevSweep.position;
          const {x: x3, y: y3} = futureSweep.position;

          let vector1 = {x1: x1, y1: y1, x2: x2, y2: y2}; //AB
          let vector2 = {x1: x2, y1: y2, x2: x3, y2: y3}; //BC
          const rotateAngle = angleBetweenVectors(vector1, vector2);

          await mpSdk.Camera.rotate(rotateAngle, 0, {speed: 50});
        }
      } catch (moveErr) {
        console.error("Ошибка перемещения камеры к свипу:", moveErr);
      }
    }
  }

  const buildAndRunPath = async () => {
    // const startSweepId = "2sdesz1hz3s2rqi982bw4xuxd";
    const startSweepId = currentUserSweep;
    console.log("startSweepId", startSweepId);
    const endSweepId = "82uuqxx0equua3i86fagymnfc";
    try {
      const modelData = await mpSdk.Model.getData();
      const sceneModels = await mpSdk.Scene.query(["model"]);
      if (!sceneModels || sceneModels.length === 0) {
        console.warn("Не удалось найти объекты 'model' в сцене");
        return;
      }
      const geometryRoot = sceneModels[0].parent;
      if (!geometryRoot) {
        console.warn("У объекта model нет родителя с геометрией");
        return;
      }

      // (b) Создаём граф свипов, учитывающий стены, передавая geometryRoot
      const sweepGraph = await mpSdk.Sweep.createGraph({geometry: geometryRoot});

      for (const edge of sweepGraph.edges) {
        if (edge.weight > 3.8) {
          sweepGraph.removeEdge(edge);
        }
      }

      // (c) Получаем вершины графа для заданных свипов
      const startVertex = sweepGraph.vertex(startSweepId);
      const endVertex = sweepGraph.vertex(endSweepId);

      if (!startVertex || !endVertex) {
        console.error("startSweepId или endSweepId не найдены в графе!");
        return;
      }

      // (d) Проверяем, есть ли ребро напрямую (на всякий случай)
      console.log(`Есть ли ребро между точками?`, sweepGraph.hasEdge(startVertex, endVertex));

      // (e) Ищем путь через A*
      const aStarRunner = mpSdk.Graph.createAStarRunner(sweepGraph, startVertex, endVertex);
      const pathResult = aStarRunner.exec();
      const {path, cost} = pathResult;
      if (!path || path.length === 0) {
        console.error("Путь не найден A*-алгоритмом");
        alert("Путь не найден A*-алгоритмом");
        return;
      }

      console.log(
        "Путь свипов найден A*: ",
        path.map(v => v.id),
      );
      console.log("Общая 'стоимость' пути:", cost);

      path.forEach(v => {
        const sweep = modelData.sweeps.find(sw => sw.uuid === v.id);
        addTag(sweep?.position);
      });

      //// перемещение по свипам
      await moveByPath(path);

      console.log("Пройден весь путь между заданными свипами.");
    } catch (err) {
      console.error("Ошибка при построении или перемещении по пути:", err);
    }
  };

  const moveToSweepBymoveTo = sweepId => {
    if (!mpSdk) return;

    const transition = mpSdk.Sweep.Transition.INSTANT;
    const transitionTime = 2000;

    mpSdk.Sweep.moveTo(sweepId, {
      // rotation: rotation,
      transition: transition,
      transitionTime: transitionTime,
    })
      .then(function (sweepId) {
        // Move successful.
        console.log("Arrived at sweep " + sweepId);
      })
      .catch(function (error) {
        console.log("error with Arrived at sweep " + sweepId);
      });
  };

  const teleportToOffice = () => {
    moveToSweepBymoveTo("82uuqxx0equua3i86fagymnfc");
  };

  const addModelToSweep = async sweepSid => {
    try {
      // 1️⃣ Получаем данные о Sweep
      const modelData = await mpSdk.Model.getData();
      const sweepData = modelData.sweeps.find(sw => sw.sid === sweepSid);

      // 2️⃣ Создаём объект в сцене
      const [sceneObject] = await mpSdk.Scene.createObjects(1);
      // const node = sceneObject.createNode();
      const [node] = sceneObject.addNodes(1);

      const loader = new GLTFLoader();
      loader.load("/model/dancing_stormtrooper.glb", gltf => {
        const model = gltf.scene;

        // 4️⃣ Устанавливаем позицию модели в координаты Sweep
        model.position.set(sweepData.position.x, sweepData.position.y, sweepData.position.z);
        // model.scale.set(0.5, 0.5, 0.5); // Возможно, нужно уменьшить модель

        node.addComponent(model); // Добавляем модель в объект сцены

        console.log("✅ Модель добавлена на Sweep:", sweepSid);
      });
    } catch (error) {
      console.error("❌ Ошибка добавления модели:", error);
    }
  };

  async function addModelToScene(mpSdk, sweepSid) {
    try {
      const modelData = await mpSdk.Model.getData();
      const sweepData = modelData.sweeps.find(sw => sw.sid === sweepSid);
      const {position} = sweepData;
      // 1️⃣ Получаем доступ к внутренней сцене Matterport (ThreeJS)
      const {scene: mpScene} = await mpSdk.Renderer.getThreeScene();

      // 2️⃣ Загружаем модель через GLTFLoader
      const loader = new GLTFLoader();
      loader.load(
        "/model/dancing_stormtrooper.glb",
        gltf => {
          const model = gltf.scene;

          // 3️⃣ Устанавливаем позицию, масштаб (при необходимости)
          model.position.set(position.x, position.y, position.z);
          model.scale.set(0.5, 0.5, 0.5);

          // 4️⃣ Добавляем модель в "родную" сцену Matterport
          mpScene.add(model);

          console.log("✅ Модель добавлена в сцену Matterport!");
        },
        undefined,
        error => {
          console.error("❌ Ошибка загрузки GLTF:", error);
        },
      );
    } catch (error) {
      console.error("❌ Ошибка добавления модели:", error);
    }
  }

  const menuOptions: IMenuOption[] = [
    {name: "Teleport to office", onClick: teleportToOffice},
    {name: "Navigate to office", onClick: buildAndRunPath},
  ];

  return (
    <div style={{width: "100%", height: "100vh"}} className="tyty">
      <iframe
        id="showcase"
        ref={iframeRef}
        src="/showcase-bundle/showcase.html?m=m72PGKzeknR&applicationKey=295ba0c0f04541318359a8e75af33043"
        style={{width: "100%", height: "100%"}}
      />
      {mpSdk && <Menu options={menuOptions} />}
    </div>
  );
}
