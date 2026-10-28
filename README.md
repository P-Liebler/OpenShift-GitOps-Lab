# OpenShift GitOps Lab (Demo)

Standalone static demo for OpenShift 4.21/4.22 and Red Hat OpenShift GitOps / Argo CD.
It does **not** deploy Private-IIP and does not access cluster APIs.

## Design

- One small Nginx workload listening on **8080** (not privileged port 80).
- Runnable non-root NGINX image `docker.io/nginx/nginx-unprivileged:stable-alpine` with an unprivileged 8080 listener. The previous Red Hat UBI9 NGINX image was an S2I builder and exited instead of serving pages.
- Restrictive container context, no fixed UID and no extra SCC permissions. HTML/CSS/JS are mounted into the NGINX document root `/usr/share/nginx/html/`.
- Kustomize generates a versioned ConfigMap from the HTML, CSS and JS files.
  Every website change creates a new ConfigMap hash and triggers a rollout on sync.
- Kubernetes Deployment + Service + OpenShift Route (TLS at router; browser HTTP redirected to HTTPS).
- No secrets, database, persistent volumes, external frontend dependencies or direct cluster credentials.
- Interactive website timeline is explicitly a **local simulation**, not live Argo status.

## Install without oc (OpenShift + Argo CD web interface)

1. Reuse your existing OpenShift namespace/project `gitops-demo`. In OpenShift,
   check the label `argocd.argoproj.io/managed-by=openshift-gitops` is present.
2. In the `openshift-gitops` Argo CD UI, select **NEW APP**.
3. Application name: `openshift-gitops-lab`; Project: `default`; Sync policy: `Manual`.
4. Repository URL: `https://github.com/P-Liebler/OpenShift-GitOps-Lab.git`.
5. Revision: `main`; Path: `.`.
6. Destination cluster: `https://kubernetes.default.svc`; namespace: `gitops-demo`.
7. Click **CREATE**, then **SYNC** and **SYNCHRONIZE**.
8. Expect `Synced` and `Healthy`; view **Networking > Routes > gitops-lab** in OpenShift.
   The Route host is assigned by the cluster. It must resolve inside your network.

Do not enable auto-prune or self-heal until the first deployment works. This demo uses
unique resource names and is independent of your existing `guestbook-ui` Deployment.
If an older demo fails, you may remove that *separate* Argo Application after checking
which Kubernetes resources its deletion dialog proposes to delete.

## Fix an existing deployed version

If you already deployed the previous image and the Pod is in `CrashLoopBackOff`,
open the existing `openshift-gitops-lab` application in Argo CD, choose **REFRESH**,
then **SYNC > SYNCHRONIZE** (with PRUNE, FORCE and REPLACE disabled). After the rollout,
check that the `gitops-lab` Pod is Running/Ready and that its Route serves the page.
Do not delete the namespace or change the OpenShift SCC.

## Make a real GitOps change

1. Edit `site/index.html` (heading or `v1.0.0`) on `main` in this repository.
2. Commit the change to `main`.
3. In Argo CD, use **REFRESH**, then **SYNC** (unless you explicitly enabled automated sync).
4. Watch the updated ConfigMap, new ReplicaSet/Pod and the route response.

The ConfigMap mounts use `subPath` for individual files; rollout happens because
Kustomize changes the generated ConfigMap name and updates the Pod template reference.
Do not edit the generated ConfigMap directly inside OpenShift.

## Troubleshooting

- **OutOfSync** before first sync is normal.
- **Forbidden** when creating resources: verify the Argo CD namespace label and permissions.
- **CrashLoopBackOff**: inspect Pod logs and Events. Never grant `anyuid` to work around a port issue.
- **ImagePullBackOff**: check external registry connectivity and image pull policy.
- **Route unavailable**: inspect Route hostname and cluster ingress DNS/certificate; an internal lab domain may require local DNS and a trusted cluster CA.
- **Degraded**: inspect the exact Pod failing readiness/liveness, not only Argo Sync status.

## Resource budget

Deployment: 1 replica; CPU requests 25m, memory requests 64Mi; CPU limits 300m,
RAM limits 256Mi. Real cluster load depends on the image and node availability.

## Scope and safety

This is a *test* deployment in an independent repository. The Private-IIP repository
is not used or modified by this lab. This demo is not a production release. The image currently uses a moving `stable-alpine` tag for simplicity;
for production you would use an approved pinned digest, vulnerability scan,
and verified update policy.
