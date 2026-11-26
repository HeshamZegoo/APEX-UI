"use client";
import { useMemo, useRef } from "react";
import { BufferAttribute, BufferGeometry, PointsMaterial, Points } from "three";
import { useFrame } from "@react-three/fiber";
export default function BGParticles({ visible }: { visible: boolean; birthTime?: number | null; containerSize?: {width:number;height:number} }) {
 const points=useRef<Points>(null);
 const geometry=useMemo(()=>{const count=4200;const positions=new Float32Array(count*3);const colors=new Float32Array(count*3);for(let i=0;i<count;i++){const r=2.2+Math.random()*5.5;const t=Math.random()*Math.PI*2;positions[i*3]=Math.cos(t)*r;positions[i*3+1]=(Math.random()-.5)*5.8;positions[i*3+2]=-1-Math.random()*5;const c=.45+Math.random()*.55;colors[i*3]=.12*c;colors[i*3+1]=.72*c;colors[i*3+2]=.9*c;}const g=new BufferGeometry();g.setAttribute("position",new BufferAttribute(positions,3));g.setAttribute("color",new BufferAttribute(colors,3));return g;},[]);
 const material=useMemo(()=>new PointsMaterial({size:.018,vertexColors:true,transparent:true,opacity:.58,depthWrite:false}),[]);
 useFrame(({clock})=>{if(points.current&&visible){points.current.rotation.y=Math.sin(clock.elapsedTime*.08)*.06;points.current.rotation.x=Math.cos(clock.elapsedTime*.05)*.025;}});
 return visible?<points ref={points} geometry={geometry} material={material} frustumCulled={false}/>:null;
}